import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

declare global {
    var pdfjsLib: any;
}

type Tool = 'select' | 'text' | 'image' | 'draw' | 'rect';

interface IObject {
    id: number;
    type: 'text' | 'image' | 'path' | 'rect';
    x: number;
    y: number;
    width?: number;
    height?: number;
    text?: string;
    fontSize?: number;
    color?: string;
    imageData?: string;
    mimeType?: string;
    points?: { x: number; y: number }[];
}

interface PDFEditorProps {
    isOpen: boolean;
    onClose: () => void;
    pdfData: string;
    onSave: (newPdfData: string) => void;
}

const ToolbarButton: React.FC<{ icon: string; title: string; active?: boolean; onClick: () => void; disabled?: boolean; }> = ({ icon, title, active, onClick, disabled }) => (
    <button
        onClick={onClick}
        title={title}
        disabled={disabled}
        className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${
            active 
                ? 'bg-purple-600 text-white' 
                : 'text-gray-300 hover:bg-gray-700 hover:text-white disabled:text-gray-600 disabled:cursor-not-allowed'
        }`}
    >
        <span className="material-symbols-outlined">{icon}</span>
    </button>
);

const PDFEditor: React.FC<PDFEditorProps> = ({ isOpen, onClose, pdfData, onSave }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const pdfDocRef = useRef<any>(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [numPages, setNumPages] = useState(0);

    const [objects, setObjects] = useState<IObject[]>([]);
    const [history, setHistory] = useState<IObject[][]>([[]]);
    const [historyIndex, setHistoryIndex] = useState(0);

    const [activeTool, setActiveTool] = useState<Tool>('select');
    const [selectedObjectIndex, setSelectedObjectIndex] = useState<number | null>(null);

    const [isDrawing, setIsDrawing] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState<string | null>(null);
    const dragOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

    const [currentTextOptions, setCurrentTextOptions] = useState({ fontSize: 16, color: '#000000' });
    const imageInputRef = useRef<HTMLInputElement>(null);

    const updateHistory = (newObjects: IObject[]) => {
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(newObjects);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    };

    const handleUndo = () => {
        if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            setHistoryIndex(newIndex);
            setObjects(history[newIndex]);
        }
    };

    const handleRedo = () => {
        if (historyIndex < history.length - 1) {
            const newIndex = historyIndex + 1;
            setHistoryIndex(newIndex);
            setObjects(history[newIndex]);
        }
    };

    const getCanvasCoordinates = (e: React.MouseEvent): { x: number; y: number } => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left) / (rect.width / canvas.width),
            y: (e.clientY - rect.top) / (rect.height / canvas.height),
        };
    };
    
    const dataURItoUint8Array = (dataURI: string) => {
        if (!dataURI || typeof dataURI !== 'string') return new Uint8Array();
        try {
            let base64 = dataURI;
            if (dataURI.includes(',')) base64 = dataURI.split(',')[1];
            const cleanBase64 = base64.trim().replace(/\s/g, '');
            const binary = atob(cleanBase64);
            const len = binary.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
                bytes[i] = binary.charCodeAt(i);
            }
            return bytes;
        } catch (e) {
            console.error("Failed to decode base64 string", e);
            return new Uint8Array();
        }
    };

    const renderPage = useCallback(async (pageNum: number) => {
        if (!pdfDocRef.current) return;
        const page = await pdfDocRef.current.getPage(pageNum);
        const viewport = page.getViewport({ scale: 2 });
        const canvas = canvasRef.current;
        if (!canvas) return;
        const context = canvas.getContext('2d');
        if (!context) return;
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        await page.render({ canvasContext: context, viewport }).promise;
        drawObjects(context);
    }, [objects]);

    useEffect(() => {
        if (!isOpen) return;
        if (typeof window !== 'undefined' && window.pdfjsLib) {
             window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
        }
        const loadPdf = async () => {
            try {
                const pdfBytes = dataURItoUint8Array(pdfData);
                if (pdfBytes.length === 0) return;
                const loadingTask = window.pdfjsLib.getDocument({ data: pdfBytes });
                const pdf = await loadingTask.promise;
                pdfDocRef.current = pdf;
                setNumPages(pdf.numPages);
                renderPage(pageNumber);
            } catch (error) {
                console.error("Error loading PDF", error);
            }
        };
        loadPdf();
    }, [isOpen, pdfData, pageNumber, renderPage]);

    const drawObjects = (ctx: CanvasRenderingContext2D) => {
        objects.forEach((obj, index) => {
            ctx.save();
            if (obj.type === 'path' && obj.points) {
                ctx.beginPath();
                ctx.moveTo(obj.points[0].x, obj.points[0].y);
                obj.points.forEach(p => ctx.lineTo(p.x, p.y));
                ctx.strokeStyle = '#ff0000';
                ctx.lineWidth = 2;
                ctx.stroke();
            } else if (obj.type === 'text') {
                ctx.fillStyle = obj.color || '#000000';
                ctx.font = `${obj.fontSize || 16}px sans-serif`;
                ctx.fillText(obj.text || '', obj.x, obj.y);
            } else if (obj.type === 'image' && obj.imageData) {
                const img = new Image();
                img.src = obj.imageData;
                if(img.complete) {
                    ctx.drawImage(img, obj.x, obj.y, obj.width!, obj.height!);
                } else {
                    img.onload = () => ctx.drawImage(img, obj.x, obj.y, obj.width!, obj.height!);
                }
            } else if (obj.type === 'rect') {
                ctx.strokeStyle = '#0000ff';
                ctx.lineWidth = 2;
                ctx.strokeRect(obj.x, obj.y, obj.width!, obj.height!);
            }
            if (index === selectedObjectIndex) {
                ctx.strokeStyle = '#00f';
                ctx.setLineDash([5, 5]);
                const padding = 5;
                const rectX = obj.x - padding;
                const rectY = obj.y - padding - (obj.type === 'text' ? obj.fontSize || 16 : 0);
                const rectWidth = (obj.width || (obj.type === 'text' ? ctx.measureText(obj.text || '').width : 0)) + padding * 2;
                const rectHeight = (obj.height || (obj.type === 'text' ? obj.fontSize || 16 : 0)) + padding * 2;
                ctx.strokeRect(rectX, rectY, rectWidth, rectHeight);
            }
            ctx.restore();
        });
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        const { x, y } = getCanvasCoordinates(e);
        if (activeTool === 'select') {
            const clickedIndex = getObjectAtPosition(x, y);
            setSelectedObjectIndex(clickedIndex);
            if (clickedIndex !== null) {
                setIsDragging(true);
                dragOffset.current = { x: x - objects[clickedIndex].x, y: y - objects[clickedIndex].y };
            }
        } else {
            setIsDrawing(true);
            const newObject: IObject = { id: Date.now(), type: activeTool === 'draw' ? 'path' : activeTool === 'rect' ? 'rect' : 'text', x, y };
            if (activeTool === 'draw') newObject.points = [{ x, y }];
            else if (activeTool === 'rect') { newObject.width = 0; newObject.height = 0; }
            else if (activeTool === 'text') { newObject.text = 'New Text'; newObject.fontSize = currentTextOptions.fontSize; newObject.color = currentTextOptions.color; }
            setObjects(prev => [...prev, newObject]);
            setSelectedObjectIndex(objects.length);
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDrawing && !isDragging && !isResizing) return;
        const { x, y } = getCanvasCoordinates(e);
        if (isDragging && selectedObjectIndex !== null) {
            const updated = [...objects];
            updated[selectedObjectIndex].x = x - dragOffset.current.x;
            updated[selectedObjectIndex].y = y - dragOffset.current.y;
            setObjects(updated);
        } else if (isDrawing) {
            const current = [...objects];
            const last = current[current.length - 1];
            if (last.type === 'path') last.points!.push({ x, y });
            else if (last.type === 'rect') { last.width = x - last.x; last.height = y - last.y; }
            setObjects(current);
        }
    };

    const handleMouseUp = () => {
        if (isDrawing || isDragging || isResizing) updateHistory(objects);
        setIsDrawing(false);
        setIsDragging(false);
        setIsResizing(null);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target!.result as string;
                img.onload = () => {
                    const newObject: IObject = { id: Date.now(), type: 'image', x: 50, y: 50, width: img.width / 4, height: img.height / 4, imageData: event.target!.result as string, mimeType: e.target.files![0].type };
                    const newObjects = [...objects, newObject];
                    setObjects(newObjects);
                    updateHistory(newObjects);
                };
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const getObjectAtPosition = (x: number, y: number): number | null => {
        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx) return null;
        for (let i = objects.length - 1; i >= 0; i--) {
            const obj = objects[i];
            let objY = obj.y;
            let objHeight = obj.height || 0;
            if (obj.type === 'text') { objY -= obj.fontSize || 16; objHeight = obj.fontSize || 16; }
            const width = obj.width || (obj.type === 'text' ? ctx.measureText(obj.text!).width : 0);
            if (x >= obj.x && x <= obj.x + width && y >= objY && y <= objY + objHeight) return i;
        }
        return null;
    };
    
    const handleSave = async () => {
        try {
            const existingPdfBytes = dataURItoUint8Array(pdfData);
            const pdfDoc = await PDFDocument.load(existingPdfBytes);
            const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
            const page = pdfDoc.getPages()[pageNumber - 1];
            const { width, height } = page.getSize();
            const canvas = canvasRef.current!;
            const scale = width / canvas.width;
            for (const obj of objects) {
                const y = height - (obj.y * scale);
                const x = obj.x * scale;
                if (obj.type === 'text') {
                    page.drawText(obj.text!, { x, y, font: helveticaFont, size: (obj.fontSize || 16) * scale, color: obj.color ? rgb(parseInt(obj.color.slice(1,3),16)/255, parseInt(obj.color.slice(3,5),16)/255, parseInt(obj.color.slice(5,7),16)/255) : rgb(0,0,0) });
                } else if (obj.type === 'image' && obj.imageData) {
                    const imageBytes = obj.mimeType === 'image/jpeg' ? await pdfDoc.embedJpg(obj.imageData) : await pdfDoc.embedPng(obj.imageData);
                    page.drawImage(imageBytes, { x, y: y - (obj.height! * scale), width: obj.width! * scale, height: obj.height! * scale });
                }
            }
            const pdfBytes = await pdfDoc.save();
            const base64String = btoa(new Uint8Array(pdfBytes).reduce((data, byte) => data + String.fromCharCode(byte), ''));
            onSave(`data:application/pdf;base64,${base64String}`);
        } catch (error) {
            console.error("Failed to save PDF:", error);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/80 flex flex-col items-center p-4">
            <div className="w-full max-w-7xl bg-gray-800 rounded-t-lg p-2 flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-2">
                    <ToolbarButton icon="arrow_selector_tool" title="Select" active={activeTool === 'select'} onClick={() => setActiveTool('select')} />
                    <ToolbarButton icon="title" title="Text" active={activeTool === 'text'} onClick={() => setActiveTool('text')} />
                    <ToolbarButton icon="image" title="Image" active={activeTool === 'image'} onClick={() => imageInputRef.current?.click()} />
                    <ToolbarButton icon="draw" title="Draw" active={activeTool === 'draw'} onClick={() => setActiveTool('draw')} />
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="px-4 py-2 text-sm text-gray-300">Cancel</button>
                    <button onClick={handleSave} className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg">Save & Close</button>
                </div>
            </div>
            <div className="flex-1 w-full max-w-7xl bg-gray-50 overflow-auto p-4 rounded-b-lg">
                <canvas ref={canvasRef} className="mx-auto shadow-xl" onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseOut={handleMouseUp} />
            </div>
            <input type="file" ref={imageInputRef} accept="image/png, image/jpeg" onChange={handleImageUpload} className="hidden" />
        </div>
    );
};

export default PDFEditor;