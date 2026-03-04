import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

interface StudentData {
    name: string;
    indexNumber: string;
    programme: string;
    className: string;
    gender: string;
    residence: string;
    house: string;
    aggregate: string;
    admissionNumber: string;
    photoBase64?: string;
    dateOfBirth?: string;
    enrollmentCode?: string;
    phoneNumber?: string;
    presentAddress?: string;
    nationality?: string;
    hometown?: string;
    religion?: string;
    previousSchool?: string;
    beceYear?: string;
    parentName?: string;
    parentRelationship?: string;
    parentContact?: string;
    parentWhatsapp?: string;
    parentOccupation?: string;
    admissionDate?: string;
}

interface LayoutField {
    id: string;
    x: number; 
    y: number; 
    width?: number; 
    height?: number; 
    enabled: boolean;
}

const dataURItoUint8Array = (dataURI: string) => {
    if (!dataURI || typeof dataURI !== 'string') return new Uint8Array();
    try {
        let base64 = dataURI;
        if (dataURI.includes(',')) {
            base64 = dataURI.split(',')[1];
        }

        // Clean up whitespace and handle padding
        const cleanBase64 = base64.trim().replace(/\s/g, '');
        const binary = atob(cleanBase64);
        const len = binary.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes;
    } catch (e) {
        console.error("Error converting Data URI", e);
        return new Uint8Array();
    }
};

export const generateFilledPdf = async (
    templateDataUri: string,
    docId: string, 
    data: StudentData,
    layoutConfig?: LayoutField[]
): Promise<string> => {
    try {
        const pdfBytes = dataURItoUint8Array(templateDataUri);
        if (pdfBytes.length === 0) throw new Error("Invalid template data");

        const pdfDoc = await PDFDocument.load(pdfBytes);
        const pages = pdfDoc.getPages();
        const firstPage = pages[0];
        const { width, height } = firstPage.getSize();

        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const color = rgb(0, 0, 0);
        const fontSize = 10;

        const dataMap: Record<string, string> = {
            name: data.name,
            indexNumber: data.indexNumber,
            programme: data.programme,
            className: data.className,
            gender: data.gender,
            residence: data.residence,
            house: data.house,
            aggregate: data.aggregate,
            admissionNumber: data.admissionNumber,
            dateOfBirth: data.dateOfBirth || '',
            enrollmentCode: data.enrollmentCode || '',
            phoneNumber: data.phoneNumber || '',
            presentAddress: data.presentAddress || '',
            nationality: data.nationality || '',
            hometown: data.hometown || '',
            religion: data.religion || '',
            previousSchool: data.previousSchool || '',
            beceYear: data.beceYear || '',
            parentName: data.parentName || '',
            parentRelationship: data.parentRelationship || '',
            parentContact: data.parentContact || '',
            parentWhatsapp: data.parentWhatsapp || '',
            parentOccupation: data.parentOccupation || '',
            admissionDate: data.admissionDate || '',
        };

        if (layoutConfig && layoutConfig.length > 0) {
            for (const field of layoutConfig) {
                if (!field.enabled) continue;

                const boxX = (field.x / 100) * width;
                const boxTopY = (field.y / 100) * height; 
                const boxWidth = (field.width ? field.width / 100 : 0) * width;
                const boxHeight = (field.height ? field.height / 100 : 0) * height;

                if (field.id === 'photo' && data.photoBase64) {
                    try {
                        if (data.photoBase64.includes('image/svg+xml')) continue;
                        let image;
                        if (data.photoBase64.startsWith('data:image/png')) {
                            image = await pdfDoc.embedPng(dataURItoUint8Array(data.photoBase64));
                        } else {
                            image = await pdfDoc.embedJpg(dataURItoUint8Array(data.photoBase64));
                        }
                        
                        let imgWidth = boxWidth || 100;
                        let imgHeight = boxHeight;
                        if (!imgHeight) {
                            const imgDims = image.scale(1); 
                            imgHeight = (imgDims.height / imgDims.width) * imgWidth;
                        }
                        const pdfY = height - boxTopY - imgHeight;
                        firstPage.drawImage(image, { x: boxX, y: pdfY, width: imgWidth, height: imgHeight });
                    } catch (e) {
                        console.warn("Could not embed student photo.", e);
                    }
                } else if (dataMap[field.id]) {
                    const textValue = dataMap[field.id].toString().toUpperCase();
                    const effectiveHeight = boxHeight > 5 ? boxHeight : 12; 
                    const centerYFromTop = boxTopY + (effectiveHeight / 2);
                    const pdfY = height - centerYFromTop - (fontSize / 2) + 1.5; 
                    firstPage.drawText(textValue, { x: boxX, y: pdfY, size: fontSize, font: font, color: color });
                }
            }
        }

        const modifiedPdfBytes = await pdfDoc.save();
        let binary = '';
        const len = modifiedPdfBytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(modifiedPdfBytes[i]);
        }
        const base64String = btoa(binary);
        return `data:application/pdf;base64,${base64String}`;
    } catch (error) {
        console.error("Error generating filled PDF:", error);
        throw error;
    }
};