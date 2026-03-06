import React, { useState, useEffect, useRef } from 'react';
import AdminModal from './AdminModal';
import { useToast } from '../shared/ToastContext';
import { AdminInput, AdminSelect } from './forms';

declare global {
    var pdfjsLib: any;
}

interface LayoutField {
    id: string;
    label: string;
    type: 'text' | 'image';
    x: number; 
    y: number; 
    width?: number; 
    height?: number; 
    enabled: boolean;
}

interface AlignmentGuide {
    type: 'vertical' | 'horizontal';
    position: number; 
    isCenter?: boolean;
}

interface DocumentLayoutEditorProps {
    isOpen: boolean;
    onClose: () => void;
    pdfData: string;
    docId: string;
    storageKey: string;
    schoolId: string;
    admissionId: string;
}

const SYSTEM_KEYS = [
    { id: 'photo', label: 'Photo Placeholder', type: 'image' },
    { id: 'name', label: 'Full Name', type: 'text' },
    { id: 'indexNumber', label: 'Index Number', type: 'text' },
    { id: 'programme', label: 'Programme', type: 'text' },
    { id: 'className', label: 'Class', type: 'text' },
    { id: 'gender', label: 'Gender', type: 'text' },
    { id: 'residence', label: 'Residence', type: 'text' },
    { id: 'house', label: 'House', type: 'text' },
    { id: 'aggregate', label: 'Aggregate', type: 'text' },
    { id: 'admissionNumber', label: 'Admission No.', type: 'text' },
    { id: 'dateOfBirth', label: 'Date of Birth', type: 'text' },
    { id: 'enrollmentCode', label: 'Enrollment Code', type: 'text' },
    { id: 'phoneNumber', label: 'Phone Number', type: 'text' },
    { id: 'presentAddress', label: 'Present Address', type: 'text' },
    { id: 'nationality', label: 'Nationality', type: 'text' },
    { id: 'hometown', label: 'Home Town', type: 'text' },
    { id: 'religion', label: 'Religion', type: 'text' },
    { id: 'previousSchool', label: 'Previous School', type: 'text' },
    { id: 'beceYear', label: 'BECE Year', type: 'text' },
    { id: 'parentName', label: 'Guardian Name', type: 'text' },
    { id: 'parentRelationship', label: 'Relationship', type: 'text' },
    { id: 'parentContact', label: 'Guardian Contact', type: 'text' },
    { id: 'parentWhatsapp', label: 'Guardian WhatsApp', type: 'text' },
    { id: 'parentOccupation', label: 'Guardian Occupation', type: 'text' },
    { id: 'admissionDate', label: 'Admission Date', type: 'text' },
];

const DocumentLayoutEditor: React.FC<DocumentLayoutEditorProps> = ({ isOpen, onClose, pdfData, storageKey, schoolId, admissionId }) => {
    const { showToast } = useToast();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [fields, setFields] = useState<LayoutField[]>([]);
    const [availableKeys, setAvailableKeys] = useState(SYSTEM_KEYS);
    const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState<string | null>(null); 
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [alignmentGuides, setAlignmentGuides] = useState<AlignmentGuide[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [zoom, setZoom] = useState(1); 
    const [rotation, setRotation] = useState(0); // in degrees: 0, 90, 180, 270
    const [baseDimensions, setBaseDimensions] = useState({ width: 0, height: 0 });
    const [isAddFieldModalOpen, setIsAddFieldModalOpen] = useState(false);
    const [addFieldData, setAddFieldData] = useState({
        mode: 'select' as 'select' | 'custom',
        id: '',
        label: '',
        type: 'text' as 'text' | 'image'
    });

    useEffect(() => {
        if (schoolId && admissionId) {
             const settingsRaw = localStorage.getItem(`formSettings_${schoolId}_${admissionId}`);
             if (settingsRaw) {
                 const settings = JSON.parse(settingsRaw);
                 const customFields = settings.fields.map((f: any) => ({
                     id: f.id,
                     label: f.label,
                     type: f.type === 'photo' ? 'image' : 'text'
                 }));
                 const systemIds = new Set(SYSTEM_KEYS.map(k => k.id));
                 const uniqueCustomFields = customFields.filter((f: any) => !systemIds.has(f.id));
                 const merged = [...SYSTEM_KEYS, ...uniqueCustomFields];
                 setAvailableKeys(merged);
                 if (merged.length > 0) {
                     setAddFieldData(prev => ({
                         ...prev,
                         id: merged[0].id,
                         label: merged[0].label,
                         type: merged[0].type as 'text' | 'image'
                     }));
                 }
             }
        }
    }, [schoolId, admissionId]);

    useEffect(() => {
        if (isOpen) {
            const savedLayoutRaw = localStorage.getItem(storageKey);
            let initialFields: LayoutField[] = [];
            if (savedLayoutRaw) {
                try {
                    initialFields = JSON.parse(savedLayoutRaw);
                } catch (e) {
                    console.error("Error loading layout", e);
                }
            } 
            const mappedAvailable = availableKeys.map((k, i) => {
                const existing = initialFields.find(f => f.id === k.id);
                if (existing) return existing;
                return {
                    id: k.id,
                    label: k.label,
                    type: k.type as 'text' | 'image',
                    x: 10,
                    y: 10 + (i * 2),
                    width: k.type === 'image' ? 15 : undefined,
                    height: k.type === 'image' ? 15 : undefined,
                    enabled: false
                };
            });
            const customSavedFields = initialFields.filter(f => !availableKeys.some(k => k.id === f.id));
            setFields([...mappedAvailable, ...customSavedFields]);
        }
    }, [isOpen, storageKey, availableKeys]);

    // Show every document in its original orientation (up/left/right/down per PDF); reset user rotation when modal or document changes
    useEffect(() => {
        if (isOpen) setRotation(0);
    }, [isOpen, pdfData]);

    useEffect(() => {
        if (!isOpen) return;
        if (!pdfData) {
            return;
        }

        if (typeof window !== 'undefined' && window.pdfjsLib) {
            window.pdfjsLib.GlobalWorkerOptions.workerSrc =
                'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
        }

        const loadPdf = async () => {
            setIsLoading(true);
            try {
                if (typeof window === 'undefined' || !window.pdfjsLib || !window.pdfjsLib.getDocument) {
                    console.error('pdfjsLib is not available on window.');
                    showToast('PDF engine failed to load. Please refresh the page and try again.', 'error');
                    return;
                }

                // Ensure we are working with a PDF data URL or raw base64
                let base64 = pdfData;
                if (base64.startsWith('data:') && base64.includes(',')) {
                    const [meta, dataPart] = base64.split(',');
                    if (!meta.includes('application/pdf')) {
                        showToast('Uploaded document is not a valid PDF file.', 'error');
                        return;
                    }
                    base64 = dataPart;
                }

                const cleanBase64 = base64.trim().replace(/\s/g, '');
                const binary = atob(cleanBase64);
                const len = binary.length;
                const bytes = new Uint8Array(len);
                for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);

                const loadingTask = window.pdfjsLib.getDocument({ data: bytes });
                const pdf = await loadingTask.promise;
                const page = await pdf.getPage(1);

                const canvas = canvasRef.current;
                const context = canvas?.getContext('2d');
                if (canvas && context) {
                    // Use PDF's own rotation as baseline, but normalise 180° pages so they don't appear upside down.
                    let intrinsicRotation = page.rotate || 0;
                    if (intrinsicRotation === 180) {
                        intrinsicRotation = 0;
                    }

                    // Add any extra rotation from the toolbar (0, 90, 180, 270)
                    const totalRotation = (intrinsicRotation + rotation) % 360;
                    const viewport = page.getViewport({ scale: 1.6, rotation: totalRotation });

                    canvas.height = viewport.height;
                    canvas.width = viewport.width;
                    setBaseDimensions({ width: viewport.width, height: viewport.height });

                    await page.render({ canvasContext: context, viewport }).promise;
                }
            } catch (error) {
                console.error('Error rendering PDF for editor', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadPdf();
    }, [isOpen, pdfData, rotation]);

    const handleMouseDown = (e: React.MouseEvent, field: LayoutField, handle?: string) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        setSelectedFieldId(field.id);
        if (handle === 'se') {
            setIsResizing('se');
            e.stopPropagation();
        } else {
            setIsDragging(true);
            const fieldLeftPx = (field.x / 100) * rect.width;
            const fieldTopPx = (field.y / 100) * rect.height;
            setDragOffset({ x: mouseX - fieldLeftPx, y: mouseY - fieldTopPx });
            e.stopPropagation();
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!containerRef.current || (!isDragging && !isResizing) || !selectedFieldId) return;
        const rect = containerRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const SNAP_THRESHOLD_PX = 12; 
        const snapThresholdX = (SNAP_THRESHOLD_PX / rect.width) * 100;
        const snapThresholdY = (SNAP_THRESHOLD_PX / rect.height) * 100;
        const guides: AlignmentGuide[] = [];
        const newFields = [...fields];
        const fieldIndex = newFields.findIndex(f => f.id === selectedFieldId);
        if (fieldIndex === -1) return;
        const currentField = newFields[fieldIndex];
        let newX = currentField.x;
        let newY = currentField.y;
        let newW = currentField.width;
        let newH = currentField.height;
        if (isDragging) {
            newX = ((mouseX - dragOffset.x) / rect.width) * 100;
            newY = ((mouseY - dragOffset.y) / rect.height) * 100;
            const currentW = currentField.width || (currentField.type === 'text' ? 10 : 15);
            const currentH = currentField.height || 5;
            let bestShiftX = { diff: Infinity, snapVal: newX, guide: null as AlignmentGuide | null };
            let bestShiftY = { diff: Infinity, snapVal: newY, guide: null as AlignmentGuide | null };
            if (Math.abs(newX + (currentW / 2) - 50) < snapThresholdX) {
                bestShiftX = { diff: Math.abs(newX + (currentW / 2) - 50), snapVal: 50 - (currentW / 2), guide: { type: 'vertical', position: 50, isCenter: true } };
            }
            if (Math.abs(newY + (currentH / 2) - 50) < snapThresholdY) {
                 bestShiftY = { diff: Math.abs(newY + (currentH / 2) - 50), snapVal: 50 - (currentH / 2), guide: { type: 'horizontal', position: 50, isCenter: true } };
            }
            fields.forEach(other => {
                if (other.id === selectedFieldId || !other.enabled) return;
                const otherW = other.width || (other.type === 'text' ? 10 : 15);
                const otherH = other.height || 5;
                const otherRight = other.x + otherW;
                const otherBottom = other.y + otherH;
                const otherCenterX = other.x + (otherW / 2);
                const otherCenterY = other.y + (otherH / 2);
                const curRight = newX + currentW;
                const curBottom = newY + currentH;
                const curCenterX = newX + currentW / 2;
                const curCenterY = newY + currentH / 2;
                const xSnaps = [
                    { type: 'LL', val: other.x, dist: Math.abs(newX - other.x), guidePos: other.x },
                    { type: 'LR', val: otherRight, dist: Math.abs(newX - otherRight), guidePos: otherRight },
                    { type: 'RL', val: other.x - currentW, dist: Math.abs(curRight - other.x), guidePos: other.x },
                    { type: 'RR', val: otherRight - currentW, dist: Math.abs(curRight - otherRight), guidePos: otherRight },
                    { type: 'CC', val: otherCenterX - currentW / 2, dist: Math.abs(curCenterX - otherCenterX), guidePos: otherCenterX, isCenter: true }
                ];
                for (const snap of xSnaps) {
                    if (snap.dist < snapThresholdX && snap.dist < bestShiftX.diff) {
                        bestShiftX = { diff: snap.dist, snapVal: snap.val, guide: { type: 'vertical', position: snap.guidePos, isCenter: snap.isCenter } };
                    }
                }
                const ySnaps = [
                    { type: 'TT', val: other.y, dist: Math.abs(newY - other.y), guidePos: other.y },
                    { type: 'TB', val: otherBottom, dist: Math.abs(newY - otherBottom), guidePos: otherBottom },
                    { type: 'BT', val: other.y - currentH, dist: Math.abs(curBottom - other.y), guidePos: other.y },
                    { type: 'BB', val: otherBottom - currentH, dist: Math.abs(curBottom - otherBottom), guidePos: otherBottom },
                    { type: 'CC', val: otherCenterY - currentH / 2, dist: Math.abs(curCenterY - otherCenterY), guidePos: otherCenterY, isCenter: true }
                ];
                for (const snap of ySnaps) {
                    if (snap.dist < snapThresholdY && snap.dist < bestShiftY.diff) {
                         bestShiftY = { diff: snap.dist, snapVal: snap.val, guide: { type: 'horizontal', position: snap.guidePos, isCenter: snap.isCenter } };
                    }
                }
            });
            if (bestShiftX.guide) { newX = bestShiftX.snapVal; guides.push(bestShiftX.guide); }
            if (bestShiftY.guide) { newY = bestShiftY.snapVal; guides.push(bestShiftY.guide); }
            newX = Math.max(0, Math.min(100, newX));
            newY = Math.max(0, Math.min(100, newY));
        } 
        if (isResizing === 'se') {
            const startX = (currentField.x / 100) * rect.width;
            const startY = (currentField.y / 100) * rect.height;
            newW = ((mouseX - startX) / rect.width) * 100;
            newH = ((mouseY - startY) / rect.height) * 100;
            newW = Math.max(2, newW);
            newH = Math.max(2, newH);
        }
        newFields[fieldIndex] = { ...currentField, x: newX, y: newY, width: newW, height: newH };
        setFields(newFields);
        setAlignmentGuides(guides);
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        setIsResizing(null);
        setAlignmentGuides([]);
    };

    // Zoom with mouse wheel / touchpad (Ctrl + scroll / pinch)
    const handleWheelZoom = (e: React.WheelEvent<HTMLDivElement>) => {
        // Require Ctrl to avoid hijacking normal scrolling
        if (!e.ctrlKey) return;
        e.preventDefault();

        setZoom(prev => {
            const factor = e.deltaY < 0 ? 1.05 : 0.95;
            const next = prev * factor;
            return Math.min(2, Math.max(0.25, next));
        });
    };

    // Enable keyboard arrow-key nudging for precise positioning of the selected field
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (!selectedFieldId) return;
            if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;

            // Do not hijack arrows when user is typing in an input/select/textarea or editable region
            const activeEl = document.activeElement as HTMLElement | null;
            if (activeEl) {
                const tag = activeEl.tagName;
                if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || activeEl.isContentEditable) {
                    return;
                }
            }

            e.preventDefault();
            const step = e.shiftKey ? 2 : 0.5; // Shift+Arrow = faster movement

            setFields(prev =>
                prev.map(field => {
                    if (field.id !== selectedFieldId) return field;

                    let newX = field.x;
                    let newY = field.y;

                    switch (e.key) {
                        case 'ArrowLeft':
                            newX = field.x - step;
                            break;
                        case 'ArrowRight':
                            newX = field.x + step;
                            break;
                        case 'ArrowUp':
                            newY = field.y - step;
                            break;
                        case 'ArrowDown':
                            newY = field.y + step;
                            break;
                        default:
                            break;
                    }

                    // Clamp coordinates to the document area
                    newX = Math.max(0, Math.min(100, newX));
                    newY = Math.max(0, Math.min(100, newY));

                    return { ...field, x: newX, y: newY };
                })
            );
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, selectedFieldId]);

    const toggleField = (id: string) => {
        setFields(prev => prev.map(f => f.id === id ? { ...f, enabled: !f.enabled } : f));
    };

    const addNewField = () => {
        if (!addFieldData.id || !addFieldData.label) {
            showToast("Field ID and Label are required.", "error");
            return;
        }
        const id = addFieldData.id;
        const existing = fields.find(f => f.id === id);
        if (existing) {
            setFields(prev => prev.map(f => f.id === id ? { ...f, enabled: true, label: addFieldData.label, type: addFieldData.type } : f));
            setSelectedFieldId(id);
        } else {
            const newField: LayoutField = { id: id, label: addFieldData.label, type: addFieldData.type, x: 50, y: 50, width: addFieldData.type === 'image' ? 15 : undefined, height: addFieldData.type === 'image' ? 15 : undefined, enabled: true };
            setFields(prev => [...prev, newField]);
            setSelectedFieldId(id);
        }
        setIsAddFieldModalOpen(false);
    };

    const handleSave = () => {
        const configToSave = fields.filter(f => f.enabled);
        localStorage.setItem(storageKey, JSON.stringify(configToSave));
        showToast("Layout saved successfully.", "success");
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AdminModal isOpen={isOpen} onClose={onClose} title="Configure Document Layout" size="6xl">
            <div className="flex gap-6 h-[75vh]">
                <div className="w-80 flex-shrink-0 bg-gray-50 dark:bg-dark-bg p-4 rounded-lg overflow-y-auto border border-logip-border dark:border-dark-border flex flex-col">
                    <div className="mb-4"><h4 className="font-semibold text-logip-text-header dark:text-dark-text-primary mb-1">Available Fields</h4></div>
                    <button onClick={() => setIsAddFieldModalOpen(true)} className="mb-4 w-full py-2 px-3 bg-white dark:bg-dark-surface border border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-sm text-logip-primary hover:bg-gray-50 flex items-center justify-center gap-2"><span className="material-symbols-outlined text-lg">add</span> Add Field</button>
                    <div className="space-y-2 flex-1 overflow-y-auto pr-1">
                        {fields.map(field => (
                            <div key={field.id} className={`flex items-center justify-between p-2 rounded border transition-colors ${selectedFieldId === field.id ? 'bg-purple-50 border-purple-200 dark:bg-purple-900/20' : 'bg-white border-transparent dark:bg-dark-surface'}`}>
                                <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                                    <input type="checkbox" checked={field.enabled} onChange={() => toggleField(field.id)} className="rounded border-gray-300 text-logip-primary" />
                                    <span className="text-sm font-medium truncate">{field.label}</span>
                                </label>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="flex-1 flex flex-col bg-gray-200 dark:bg-black/40 rounded-lg overflow-hidden relative">
                    <div
                        className="flex-1 overflow-auto select-none"
                        ref={scrollContainerRef}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        onWheel={handleWheelZoom}
                    >
                    {/* Top-left alignment: same inset for top and left so both edges stay visible when zooming */}
                    <div className="min-w-full min-h-full flex items-start justify-start p-6">
                        <div
                            className="relative shadow-2xl flex-shrink-0"
                            ref={containerRef}
                            style={{
                                width: baseDimensions.width * zoom || 0,
                                height: baseDimensions.height * zoom || 0,
                            }}
                            onMouseDown={() => setSelectedFieldId(null)}
                        >
                            {isLoading && (
                                <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-20 text-gray-500">
                                    Loading...
                                </div>
                            )}
                            {/* Canvas fills container; container is baseDimensions*zoom so aspect ratio is preserved */}
                            <canvas
                                ref={canvasRef}
                                className="block w-full h-full"
                                style={{ width: '100%', height: '100%' }}
                            />
                            {alignmentGuides.map((guide, idx) => (
                                <div key={idx} className={`absolute z-50 pointer-events-none ${guide.isCenter ? 'bg-purple-500' : 'bg-blue-400'}`} style={guide.type === 'vertical' ? { left: `${guide.position}%`, top: 0, bottom: 0, width: '1px', opacity: 0.8 } : { top: `${guide.position}%`, left: 0, right: 0, height: '1px', opacity: 0.8 }} />
                            ))}
                            {fields.filter(f => f.enabled).map(field => {
                                const isSelected = selectedFieldId === field.id;
                                // FIX: Dynamically construct style object to avoid TypeScript property assignment errors
                                const style: React.CSSProperties = { 
                                    left: `${field.x}%`, 
                                    top: `${field.y}%`, 
                                    fontWeight: 'normal',
                                    width: field.width ? `${field.width}%` : undefined,
                                    height: field.height ? `${field.height}%` : undefined
                                };
                                return (
                                    <div key={field.id} onMouseDown={(e) => handleMouseDown(e, field)} className={`absolute cursor-move px-2 py-1 rounded border shadow-sm z-10 flex items-center justify-center overflow-hidden ${field.type === 'image' ? 'bg-blue-500/30 border-blue-600' : 'bg-red-500/20 border-red-600 text-xs'} ${isSelected ? 'ring-2 ring-yellow-400 z-20' : ''}`} style={style}>
                                        {field.label.toUpperCase()}
                                        {isSelected && <div className="absolute bottom-0 right-0 w-3 h-3 bg-yellow-400 cursor-se-resize z-30" onMouseDown={(e) => handleMouseDown(e, field, 'se')} />}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    </div>
                    <div className="flex-shrink-0 flex items-center gap-4 px-4 py-2 bg-gray-100 dark:bg-dark-surface border-t border-logip-border dark:border-dark-border">
                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                onClick={() => setRotation((prev) => (prev + 270) % 360)}
                                className="p-1.5 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
                                title="Rotate left"
                            >
                                <span className="material-symbols-outlined text-xl">rotate_left</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setRotation((prev) => (prev + 90) % 360)}
                                className="p-1.5 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
                                title="Rotate right"
                            >
                                <span className="material-symbols-outlined text-xl">rotate_right</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    if (!pdfData) return;
                                    const printWindow = window.open('', '_blank');
                                    if (!printWindow) return;
                                    const src = pdfData.startsWith('data:') ? pdfData : `data:application/pdf;base64,${pdfData}`;
                                    printWindow.document.write(`
                                        <html>
                                          <head>
                                            <title>Print Document</title>
                                            <style>
                                              html, body { margin: 0; padding: 0; height: 100%; }
                                              iframe { border: 0; width: 100%; height: 100%; }
                                            </style>
                                          </head>
                                          <body>
                                            <iframe src="${src}" onload="this.contentWindow?.print();"></iframe>
                                          </body>
                                        </html>
                                    `);
                                    printWindow.document.close();
                                }}
                                className="p-1.5 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
                                title="Print document"
                            >
                                <span className="material-symbols-outlined text-xl">print</span>
                            </button>
                        </div>
                        <span className="text-sm font-medium text-logip-text-body dark:text-dark-text-secondary whitespace-nowrap ml-4">Zoom</span>
                        <input
                            type="range"
                            min={0.25}
                            max={2}
                            step={0.05}
                            value={zoom}
                            onChange={(e) => setZoom(Number(e.target.value))}
                            className="flex-1 h-2 bg-gray-200 dark:bg-dark-bg rounded-lg appearance-none cursor-pointer accent-logip-primary min-w-[100px]"
                        />
                        <span className="text-sm font-semibold text-logip-text-header dark:text-dark-text-primary tabular-nums w-12 text-right">{Math.round(zoom * 100)}%</span>
                    </div>
                </div>
            </div>
            <div className="pt-4 flex justify-end gap-4">
                <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg">Cancel</button>
                <button onClick={handleSave} className="px-6 py-2 bg-logip-primary text-white rounded-lg">Save Layout</button>
            </div>
            {isAddFieldModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white dark:bg-dark-surface p-6 rounded-lg w-full max-w-md">
                        <h3 className="text-lg font-bold mb-4">Add Field</h3>
                        <div className="space-y-4">
                            <div className="flex bg-gray-100 dark:bg-dark-bg p-1 rounded-lg">
                                <button type="button" onClick={() => setAddFieldData(d => ({ ...d, mode: 'select' }))} className={`flex-1 py-1.5 text-sm rounded-md ${addFieldData.mode === 'select' ? 'bg-white shadow' : ''}`}>Select from List</button>
                                <button type="button" onClick={() => setAddFieldData(d => ({ ...d, mode: 'custom', id: '', label: '', type: 'text' }))} className={`flex-1 py-1.5 text-sm rounded-md ${addFieldData.mode === 'custom' ? 'bg-white shadow' : ''}`}>Custom Field</button>
                            </div>
                            {addFieldData.mode === 'select' ? (
                                <div><AdminSelect value={addFieldData.id} onChange={(e) => { const selected = availableKeys.find(k => k.id === e.target.value); setAddFieldData(d => ({ ...d, id: e.target.value, label: selected?.label || '', type: (selected?.type as 'text' | 'image') || 'text' })); }}>{availableKeys.map(k => <option key={k.id} value={k.id}>{k.label}</option>)}</AdminSelect></div>
                            ) : (
                                <div><AdminInput value={addFieldData.id} onChange={(e) => setAddFieldData(d => ({ ...d, id: e.target.value }))} placeholder="Data Key (ID)" /></div>
                            )}
                            <div><AdminInput value={addFieldData.label} onChange={(e) => setAddFieldData(d => ({ ...d, label: e.target.value }))} placeholder="Field Label" /></div>
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <button onClick={() => setIsAddFieldModalOpen(false)} className="px-4 py-2 bg-gray-100 rounded-lg">Cancel</button>
                            <button onClick={addNewField} className="px-4 py-2 bg-logip-primary text-white rounded-lg">Add Field</button>
                        </div>
                    </div>
                </div>
            )}
        </AdminModal>
    );
};

export default DocumentLayoutEditor;
