
import { School } from '../pages/SettingsPage';

export const printTable = (
    tableElementId: string, 
    title: string, 
    school: School | null | undefined, 
    preTableContent?: string,
    admissionName?: string
) => {
    const tableElement = document.getElementById(tableElementId);
    if (!tableElement) {
        console.error(`Print Error: Element with id "${tableElementId}" not found.`);
        return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert('Please allow pop-ups for this website to print the document.');
        return;
    }

    const now = new Date();
    const formattedDate = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const formattedTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    // Using a more reliable default placeholder for school logo
    const schoolLogo = school?.logo || 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?q=80&w=200&h=200&auto=format&fit=crop';
    const schoolName = school?.name || 'School Name';

    const documentContent = `
        <!DOCTYPE html>
        <html>
            <head>
                <title>${title}</title>
                <link rel="preconnect" href="https://fonts.googleapis.com">
                <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
                <style>
                    /* Reset & Base */
                    * { box-sizing: border-box; }
                    
                    /* Page Setup - Hides Default Browser Header/Footer */
                    @page { 
                        size: A4 portrait; 
                        margin: 0; 
                    }
                    
                    body { 
                        font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; 
                        color: #1f2937;
                        margin: 0;
                        padding: 12mm 15mm 15mm 15mm; /* Top Right Bottom Left - Manual content margins */
                        -webkit-print-color-adjust: exact; 
                        print-color-adjust: exact; 
                        background-color: white;
                        position: relative;
                    }
                    
                    /* Header Layout */
                    .print-header {
                        text-align: center;
                        margin-bottom: 2rem;
                        padding-bottom: 1rem;
                        border-bottom: 2px solid #f3f4f6;
                    }
                    
                    .school-logo {
                        height: 60px;
                        width: auto;
                        object-fit: contain;
                        margin-bottom: 0.75rem;
                        display: block;
                        margin-left: auto;
                        margin-right: auto;
                    }
                    
                    .school-name {
                        font-size: 20px;
                        font-weight: 800;
                        color: #111827; /* Gray 900 */
                        margin: 0 0 0.25rem 0;
                        letter-spacing: -0.015em;
                        line-height: 1.2;
                        text-transform: uppercase;
                    }
                    
                    .admission-title {
                        font-size: 15px;
                        font-weight: 500;
                        color: #374151; /* Gray 700 */
                        margin: 0 0 0.25rem 0;
                    }
                    
                    .page-title {
                        font-size: 13px;
                        font-weight: 700;
                        color: #6b7280; /* Gray 500 */
                        margin: 0 0 0.5rem 0;
                        text-transform: uppercase;
                        letter-spacing: 0.05em;
                    }

                    .meta-date {
                        font-size: 10px;
                        color: #9ca3af; /* Gray 400 */
                        font-style: normal; /* Changed from italic per user request */
                    }

                    /* Content Styling */
                    .pre-table-content {
                        margin-bottom: 1.5rem;
                        padding: 0.75rem 1rem;
                        background-color: #f9fafb; /* Gray 50 */
                        border-radius: 0.375rem;
                        border: 1px solid #e5e7eb; /* Gray 200 */
                        font-size: 12px;
                        color: #374151;
                    }
                    
                    /* Table Styling */
                    table { 
                        width: 100%; 
                        border-collapse: collapse; 
                        font-size: 11px; 
                        margin-top: 0.5rem;
                    }
                    
                    th { 
                        background-color: #f9fafb !important; 
                        color: #4b5563 !important; 
                        font-weight: 700;
                        text-transform: uppercase;
                        letter-spacing: 0.05em;
                        font-size: 9px;
                        padding: 8px 10px; 
                        border-top: 1px solid #e5e7eb;
                        border-bottom: 1px solid #e5e7eb;
                        text-align: left; 
                    }
                    
                    td { 
                        padding: 8px 10px; 
                        border-bottom: 1px solid #f3f4f6; 
                        color: #374151;
                        vertical-align: middle;
                    }
                    
                    tr:nth-child(even) td { 
                        background-color: #fcfcfd; 
                    }
                    
                    /* Utility classes for elements copied from UI */
                    .no-print { display: none !important; }
                    input[type="checkbox"] { display: none; }
                    
                    /* Badge/Pill corrections */
                    .rounded-md, .rounded-full { border-radius: 4px; }
                    .px-2 { padding-left: 4px; padding-right: 4px; }
                    .py-1 { padding-top: 2px; padding-bottom: 2px; }
                    .text-xs { font-size: 10px; }
                    .font-semibold { font-weight: 600; }
                    
                    /* Clean up interactive elements */
                    table button {
                        background: none !important;
                        border: none !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        font: inherit !important;
                        color: inherit !important;
                        text-align: left !important;
                        display: inline !important;
                    }
                    
                    /* Hide Material Icons in print */
                    table button span.material-symbols-outlined {
                        display: none !important;
                    }

                    /* Footer */
                    .print-footer {
                        position: fixed;
                        bottom: 0;
                        left: 0;
                        right: 0;
                        border-top: 1px solid #f3f4f6;
                        padding-top: 8px;
                        padding-bottom: 8px;
                        text-align: center;
                        font-size: 9px;
                        color: #d1d5db; /* Gray 300 */
                        background-color: white;
                    }
                </style>
            </head>
            <body>
                <div class="print-header">
                    ${schoolLogo ? `<img src="${schoolLogo}" alt="Logo" class="school-logo" />` : ''}
                    <div class="school-name">${schoolName}</div>
                    ${admissionName ? `<div class="admission-title">${admissionName}</div>` : ''}
                    <div class="page-title">${title}</div>
                    <div class="meta-date">Generated on ${formattedDate} at ${formattedTime}</div>
                </div>

                ${preTableContent ? `<div class="pre-table-content">${preTableContent}</div>` : ''}

                ${tableElement.outerHTML}

                <div class="print-footer">
                    Generated by Logip System
                </div>
            </body>
        </html>
    `;

    printWindow.document.write(documentContent);
    printWindow.document.close();
    
    // Wait for images to load before printing
    const logoImg = printWindow.document.querySelector('.school-logo') as HTMLImageElement;
    
    const triggerPrint = () => {
        setTimeout(() => {
            printWindow.focus();
            printWindow.print();
            printWindow.close();
        }, 500);
    };
    
    if (logoImg) {
        if (logoImg.complete) {
            triggerPrint();
        } else {
            logoImg.onload = triggerPrint;
            logoImg.onerror = triggerPrint;
        }
    } else {
        triggerPrint();
    }
};
