import React from 'react';
import { PDFDocument } from 'pdf-lib';

interface ImagePreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    imageUrl: string;
    altText: string;
}

const dataURIToUint8Array = (dataURI: string) => {
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

const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({ isOpen, onClose, imageUrl, altText }) => {
    if (!isOpen) return null;

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        printWindow.document.write(`
            <html>
                <head>
                    <title>Print - ${altText}</title>
                    <style>
                        body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #fff; }
                        img { max-width: 100%; max-height: 100%; object-fit: contain; }
                        @media print {
                            body { margin: 0; padding: 0; }
                            img { width: 100%; height: auto; page-break-after: avoid; }
                        }
                    </style>
                </head>
                <body>
                    <img src="${imageUrl}" onload="window.print(); window.close();" />
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    const handleDownloadAsPdf = async () => {
        try {
            const pdfDoc = await PDFDocument.create();
            const bytes = dataURIToUint8Array(imageUrl);
            
            let image;
            if (imageUrl.includes('image/png')) {
                image = await pdfDoc.embedPng(bytes);
            } else {
                image = await pdfDoc.embedJpg(bytes);
            }

            const page = pdfDoc.addPage([595.28, 841.89]); // A4 Size
            const { width, height } = page.getSize();
            
            // Scaled dimensions to fit A4
            const imgDims = image.scaleToFit(width - 40, height - 40);
            
            page.drawImage(image, {
                x: (width - imgDims.width) / 2,
                y: (height - imgDims.height) / 2,
                width: imgDims.width,
                height: imgDims.height,
            });

            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `${altText}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("PDF generation failed:", error);
            // Fallback to simple image download
            const link = document.createElement('a');
            link.href = imageUrl;
            link.download = `${altText}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    return (
        <div
            className="fixed inset-0 z-[250] flex items-center justify-center p-4 transition-opacity duration-300 ease-in-out bg-black/80 backdrop-blur-sm animate-fadeIn"
            role="dialog"
            aria-modal="true"
        >
             <div className="relative w-full max-w-[95vw] h-[95vh] transform transition-all duration-300 ease-in-out animate-scaleIn bg-logip-white dark:bg-report-dark rounded-xl shadow-2xl flex flex-col overflow-hidden">
                {/* Modal Header */}
                <header className="flex-shrink-0 flex items-center justify-between p-4 border-b border-logip-border dark:border-report-border bg-white dark:bg-report-dark">
                    <h2 className="text-lg font-semibold text-logip-text-header dark:text-gray-100 truncate pr-4">{altText}</h2>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handlePrint}
                            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-lg text-logip-text-body dark:text-gray-300 bg-transparent hover:bg-gray-200/50 dark:hover:bg-gray-700/50 border border-gray-300 dark:border-gray-600 transition-colors"
                        >
                            <span className="material-symbols-outlined text-base">print</span>
                            Print
                        </button>
                        <button
                            onClick={handleDownloadAsPdf}
                            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-lg text-white bg-logip-primary hover:bg-logip-primary-hover transition-colors shadow-sm"
                        >
                            <span className="material-symbols-outlined text-base">picture_as_pdf</span>
                            Download PDF
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

                {/* Content Area */}
                <div className="flex-1 overflow-auto bg-gray-100 dark:bg-background-dark p-6 flex items-center justify-center">
                    <img
                        src={imageUrl}
                        alt={altText}
                        className="max-w-full max-h-full object-contain rounded-lg shadow-xl"
                    />
                </div>
            </div>
        </div>
    );
};

export default ImagePreviewModal;