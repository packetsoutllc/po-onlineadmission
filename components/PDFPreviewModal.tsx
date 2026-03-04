import React, { useRef, useState, useEffect } from 'react';

interface PDFPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    pdfData: string;
    fileName: string;
}

const PDFPreviewModal: React.FC<PDFPreviewModalProps> = ({ isOpen, onClose, pdfData, fileName }) => {
    const [blobUrl, setBlobUrl] = useState<string | null>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    useEffect(() => {
        let url = '';
        const generateUrl = async () => {
             try {
                // If it's already a http/blob url, use it. If data uri, convert.
                if (pdfData.startsWith('http') || pdfData.startsWith('blob')) {
                    setBlobUrl(pdfData);
                    return;
                }
                
                const res = await fetch(pdfData);
                const blob = await res.blob();
                url = URL.createObjectURL(blob);
                setBlobUrl(url);
            } catch (e) {
                console.error("Failed to create blob url", e);
                // Fallback to data URI if blob creation fails
                setBlobUrl(pdfData);
            }
        };
        
        if (isOpen && pdfData) {
            generateUrl();
        }

        return () => {
            if (url) URL.revokeObjectURL(url);
        };
    }, [pdfData, isOpen]);

    if (!isOpen) return null;

    const handlePrint = () => {
        const urlToPrint = blobUrl || pdfData;
        const printWindow = window.open(urlToPrint, '_blank');
        if (printWindow) {
             // Note: automatic print() call might be blocked by browsers when opening pdf directly in new tab
             // The user can use the browser's print button.
             // Alternatively, we can use an invisible iframe technique, but direct window is more reliable for viewing.
        } else {
             alert('Could not open print window. Please allow pop-ups.');
        }
    };

    const handleDownload = () => {
        const urlToDownload = blobUrl || pdfData;
        const link = document.createElement('a');
        link.href = urlToDownload;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 transition-opacity duration-300 ease-in-out bg-black/60 backdrop-blur-sm animate-fadeIn"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pdf-modal-title"
        >
            <div className="relative w-full max-w-[95vw] h-[95vh] transform transition-all duration-300 ease-in-out animate-scaleIn bg-logip-white dark:bg-report-dark rounded-xl shadow-2xl flex flex-col">
                {/* Modal Header */}
                <header className="flex-shrink-0 flex items-center justify-between p-4 border-b border-logip-border dark:border-report-border">
                    <h2 id="pdf-modal-title" className="text-lg font-semibold text-logip-text-header dark:text-gray-100 truncate pr-4">{fileName}</h2>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handlePrint}
                            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-lg text-logip-text-body dark:text-gray-300 bg-transparent hover:bg-gray-200/50 dark:hover:bg-gray-700/50 border border-gray-300 dark:border-gray-600 transition-colors"
                        >
                            <span className="material-symbols-outlined text-base">print</span>
                            Print
                        </button>
                        <button
                            onClick={handleDownload}
                            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-lg text-white bg-logip-primary hover:bg-logip-primary-hover transition-colors"
                        >
                            <span className="material-symbols-outlined text-base">download</span>
                            Download
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full text-logip-text-subtle hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition-colors"
                            aria-label="Close preview"
                        >
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>
                </header>

                {/* PDF Content */}
                <div className="flex-1 p-2 bg-gray-200 dark:bg-background-dark overflow-hidden rounded-b-lg relative">
                    {blobUrl ? (
                        <iframe
                            ref={iframeRef}
                            src={blobUrl}
                            title={fileName}
                            className="w-full h-full border-0 rounded-lg"
                            allow="fullscreen"
                        />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-500 dark:text-gray-400">
                             <div className="flex flex-col items-center gap-2">
                                <span className="w-8 h-8 border-2 border-gray-300 border-t-logip-primary rounded-full animate-spin"></span>
                                <span>Loading PDF...</span>
                             </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PDFPreviewModal;