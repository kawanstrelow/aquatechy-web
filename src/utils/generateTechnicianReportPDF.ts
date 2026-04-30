import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { Pool } from '@/ts/interfaces/Pool';

// Brand colors
const COLORS = {
  primary: '#364D9D',
  primaryLight: '#647AC7',
  primaryLighter: '#DCE1F5',
  gray50: '#FAFAFA',
  gray100: '#F5F5F5',
  gray200: '#E5E5E5',
  gray300: '#D4D4D4',
  gray400: '#A3A3A3',
  gray500: '#737373',
  gray600: '#525252',
  gray700: '#404040',
  gray800: '#262626',
  gray900: '#171717',
  white: '#FFFFFF'
};

interface ServicesByWeekday {
  id: string;
  status: string;
  serviceType: {
    name: string;
  };
  completedAt: string;
  clientOwner: {
    firstName: string;
    lastName: string;
  };
  pool: Pool;
  paymentPerUnit?: number; // This will be calculated by the backend based on the payment configuration
}

interface ServicesByDate {
  date: string; // e.g., "Monday, October 18th"
  services: ServicesByWeekday[];
}

interface ServiceReport {
  company?: {
    name: string;
    imageUrl?: string | null;
  };
  technician?: string;
  from?: string;
  to?: string;
  totalServicesMade?: number;
  servicesByWeekday?: ServicesByDate[];
  summary?: {
    servicesScheduled: number;
    servicesSkipped: number;
    servicesCompleted: number;
    servicesOpen: number;
    totalServices: number;
    totalPayment: number;
  };
}

export const generateTechnicianReportPDF = async (
  reportData: ServiceReport,
  fromDate: string,
  toDate: string
) => {
  try {
    
    // Normalize data structure to handle both API formats
    const normalizedData = {
      company: reportData.company || { name: 'Aquatechy', imageUrl: '/images/logotransparente.png' },
      technician: reportData.technician || 'Unknown Technician',
      from: reportData.from || fromDate,
      to: reportData.to || toDate,
      totalServicesMade: reportData.totalServicesMade || 0,
      servicesByWeekday: reportData.servicesByWeekday || [],
      summary: reportData.summary || {
        servicesScheduled: 0,
        servicesSkipped: 0,
        servicesCompleted: 0,
        servicesOpen: 0,
        totalServices: 0,
        totalPayment: 0
      }
    };
    
    
    const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  
  // Helper function to convert hex to RGB
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  };

  // Helper function to draw rounded rectangle
  const drawRoundedRect = (x: number, y: number, width: number, height: number, radius: number, fillColor?: string, strokeColor?: string) => {
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5); // Set thin border width
    if (fillColor) {
      const rgb = hexToRgb(fillColor);
      doc.setFillColor(rgb.r, rgb.g, rgb.b);
    }
    if (strokeColor) {
      const rgb = hexToRgb(strokeColor);
      doc.setDrawColor(rgb.r, rgb.g, rgb.b);
    }
    
    doc.roundedRect(x, y, width, height, radius, radius, fillColor ? 'FD' : 'D');
  };

  // Helper function to add logo
  const addLogo = async (y: number, targetHeight: number) => {
    const originalLogoUrl = normalizedData.company.imageUrl || '/images/logotransparente.png';
    
    // Use proxy endpoint for external URLs to avoid CORS issues
    const logoUrl = originalLogoUrl.startsWith('http') 
      ? `/api/proxy-image?url=${encodeURIComponent(originalLogoUrl)}`
      : originalLogoUrl;
    
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Logo loading timeout')), 5000);
      });
      
      const loadPromise = new Promise((resolve, reject) => {
        img.onload = () => {
          resolve(img);
        };
        img.onerror = (error) => {
          reject(error);
        };
        img.src = logoUrl;
      });
      
      await Promise.race([loadPromise, timeoutPromise]);
      
      // Calculate width to maintain aspect ratio
      const aspectRatio = img.width / img.height;
      const calculatedWidth = targetHeight * aspectRatio;
      
      // Center the logo horizontally
      const centeredX = (pageWidth - calculatedWidth) / 2;
      
      doc.addImage(img, 'PNG', centeredX, y, calculatedWidth, targetHeight);
      
    } catch (error) {
      console.warn('Logo loading failed, trying local fallback:', error);
      
      // Try local logo as fallback if proxy failed
      if (originalLogoUrl.startsWith('http')) {
        try {
          const localImg = new Image();
          localImg.crossOrigin = 'anonymous';
          
          await new Promise((resolve, reject) => {
            localImg.onload = resolve;
            localImg.onerror = reject;
            localImg.src = '/images/logotransparente.png';
          });
          
          // Calculate width to maintain aspect ratio for fallback logo
          const aspectRatio = localImg.width / localImg.height;
          const calculatedWidth = targetHeight * aspectRatio;
          
          // Center the logo horizontally
          const centeredX = (pageWidth - calculatedWidth) / 2;
          
          doc.addImage(localImg, 'PNG', centeredX, y, calculatedWidth, targetHeight);
          return;
        } catch (localError) {
          console.warn('Local logo also failed:', localError);
        }
      }
      
      // Final fallback to text logo
      doc.setFontSize(16);
      doc.setTextColor(255, 255, 255); // White text on blue background
      doc.setFont('helvetica', 'bold');
      
      // Center the text logo as well
      const textWidth = doc.getTextWidth(normalizedData.company.name);
      const centeredTextX = (pageWidth - textWidth) / 2;
      
      doc.text(normalizedData.company.name, centeredTextX, y + 12);
    }
  };

  // Header Section with gradient-like effect
  drawRoundedRect(0, 0, pageWidth, 30, 0, COLORS.primary, COLORS.primary);
  
  // Add logo to header (centered)
  await addLogo(7, 20);
  
  // Header text (centered below logo)
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Technician Performance Report', pageWidth / 2, 35, { align: 'center' });
  
  // Report Summary Card
  const summaryCardY = 40;
  drawRoundedRect(20, summaryCardY, pageWidth - 40, 40, 8, COLORS.gray50, COLORS.gray200);
  
  // Summary content
  doc.setTextColor(hexToRgb(COLORS.gray800).r, hexToRgb(COLORS.gray800).g, hexToRgb(COLORS.gray800).b);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Report Summary', 30, summaryCardY + 15);
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Technician: ${normalizedData.technician}`, 30, summaryCardY + 25);
  doc.text(`Period: ${format(fromDate, 'MMMM dd, yyyy')} to ${format(toDate, 'MMMM dd, yyyy')}`, 30, summaryCardY + 31);
  
  // Total services highlight
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(hexToRgb(COLORS.primary).r, hexToRgb(COLORS.primary).g, hexToRgb(COLORS.primary).b);
  doc.text(`${normalizedData.summary.servicesScheduled}`, pageWidth - 60, summaryCardY + 25);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(hexToRgb(COLORS.gray600).r, hexToRgb(COLORS.gray600).g, hexToRgb(COLORS.gray600).b);
  doc.text('Services Scheduled', pageWidth - 60, summaryCardY + 31);
  
  // Additional Summary Cards
  const additionalSummaryY = summaryCardY + 50;
  const paymentSquareSize = 30;
  const totalAvailableWidth = pageWidth - 40; // Total width minus left/right margins (20px each)
  const spacing = 10; // Equal spacing between all 4 squares
  const cardWidth = (totalAvailableWidth - 3 * spacing) / 4; // 4 squares with equal spacing
  
  // Services Completed Card
  drawRoundedRect(20, additionalSummaryY, cardWidth, 30, 8, COLORS.gray50, COLORS.gray200);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(hexToRgb(COLORS.primary).r, hexToRgb(COLORS.primary).g, hexToRgb(COLORS.primary).b);
  doc.text(`${normalizedData.summary.servicesCompleted}`, 30, additionalSummaryY + 15);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(hexToRgb(COLORS.gray600).r, hexToRgb(COLORS.gray600).g, hexToRgb(COLORS.gray600).b);
  doc.text('Completed', 30, additionalSummaryY + 22);
  
  // Services Scheduled Card
  drawRoundedRect(20 + cardWidth + spacing, additionalSummaryY, cardWidth, 30, 8, COLORS.gray50, COLORS.gray200);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(hexToRgb(COLORS.primary).r, hexToRgb(COLORS.primary).g, hexToRgb(COLORS.primary).b);
  doc.text(`${normalizedData.summary.servicesSkipped}`, 30 + cardWidth + spacing, additionalSummaryY + 15);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(hexToRgb(COLORS.gray600).r, hexToRgb(COLORS.gray600).g, hexToRgb(COLORS.gray600).b);
  doc.text('Skipped', 30 + cardWidth + spacing, additionalSummaryY + 22);
  
  // Services Open Card
  drawRoundedRect(20 + (cardWidth + spacing) * 2, additionalSummaryY, cardWidth, 30, 8, COLORS.gray50, COLORS.gray200);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(hexToRgb(COLORS.primary).r, hexToRgb(COLORS.primary).g, hexToRgb(COLORS.primary).b);
  doc.text(`${normalizedData.summary.servicesOpen}`, 30 + (cardWidth + spacing) * 2, additionalSummaryY + 15);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(hexToRgb(COLORS.gray600).r, hexToRgb(COLORS.gray600).g, hexToRgb(COLORS.gray600).b);
  doc.text('Open', 30 + (cardWidth + spacing) * 2, additionalSummaryY + 22);
  
  // Total Payment Square (equally distributed)
  const paymentSquareX = 20 + (cardWidth + spacing) * 3; // Positioned as the 4th square
  const paymentSquareY = additionalSummaryY;
  
  // Draw payment square with primary color background
  drawRoundedRect(paymentSquareX, paymentSquareY, cardWidth, 30, 8, COLORS.primary, COLORS.primary);
  
  // Add payment amount text
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(hexToRgb(COLORS.white).r, hexToRgb(COLORS.white).g, hexToRgb(COLORS.white).b);
  const paymentText = `$${normalizedData.summary.totalPayment.toFixed(2)}`;
  const paymentTextWidth = doc.getTextWidth(paymentText);
  const paymentTextX = paymentSquareX + (paymentSquareSize - paymentTextWidth) / 2;
  const paymentTextY = paymentSquareY + paymentSquareSize / 2 + 2;
  doc.text(paymentText, paymentTextX, paymentTextY);
  
  // Add "Total Payment" label below the square
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(hexToRgb(COLORS.gray600).r, hexToRgb(COLORS.gray600).g, hexToRgb(COLORS.gray600).b);
  const labelText = 'Total Payment';
  const labelTextWidth = doc.getTextWidth(labelText);
  const labelTextX = paymentSquareX + (paymentSquareSize - labelTextWidth) / 2;
  doc.text(labelText, labelTextX, paymentSquareY + paymentSquareSize + 8);
  
  // Weekday Summary Section
  const weekdaySummaryY = additionalSummaryY + 50;
  
  // Section header
  doc.setTextColor(hexToRgb(COLORS.gray800).r, hexToRgb(COLORS.gray800).g, hexToRgb(COLORS.gray800).b);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Services by Weekday', 20, weekdaySummaryY);
  
  // Add decorative line
  doc.setDrawColor(hexToRgb(COLORS.primary).r, hexToRgb(COLORS.primary).g, hexToRgb(COLORS.primary).b);
  doc.setLineWidth(2);
  doc.line(20, weekdaySummaryY + 3, 80, weekdaySummaryY + 3);
  
  // Weekday cards (using same style as Services by Date)
  const weekdayCardsY = weekdaySummaryY + 10; // Reduced from 20 to 10
  let currentWeekdayY = weekdayCardsY;
  
  // Process each weekday data
  normalizedData.servicesByWeekday.forEach((dayData, index) => {
    // Check if we need a new page
    if (currentWeekdayY > pageHeight - 80) {
      doc.addPage();
      currentWeekdayY = 30;
    }
    
    // Weekday card (same style as date cards)
    const weekdayCardWidth = pageWidth - 40;
    const weekdayCardHeight = 25;
    
    // Card background (same style as summary cards)
    drawRoundedRect(20, currentWeekdayY, weekdayCardWidth, weekdayCardHeight, 8, COLORS.gray50, COLORS.gray200);
    
    // Date text (full date)
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(hexToRgb(COLORS.gray800).r, hexToRgb(COLORS.gray800).g, hexToRgb(COLORS.gray800).b);
    doc.text(dayData.date, 30, currentWeekdayY + 15);
    
    // Calculate status breakdown
    const completedCount = dayData.services.filter(s => s.status === 'Completed').length;
    const skippedCount = dayData.services.filter(s => s.status === 'Skipped').length;
    const openCount = dayData.services.filter(s => s.status === 'Open' || s.status === 'Pending').length;
    const totalScheduled = dayData.services.length; // This includes all statuses
    
    // First line: Total scheduled services (moved up and closer spacing)
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(hexToRgb(COLORS.primary).r, hexToRgb(COLORS.primary).g, hexToRgb(COLORS.primary).b);
    doc.text(`${totalScheduled}`, pageWidth - 120, currentWeekdayY + 12);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(hexToRgb(COLORS.gray600).r, hexToRgb(COLORS.gray600).g, hexToRgb(COLORS.gray600).b);
    doc.text('Scheduled', pageWidth - 120, currentWeekdayY + 18);
    
    // Second line: Status breakdown (moved up and closer spacing)
    // Completed
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(hexToRgb('#10B981').r, hexToRgb('#10B981').g, hexToRgb('#10B981').b);
    doc.text(`${completedCount}`, pageWidth - 90, currentWeekdayY + 12);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(hexToRgb(COLORS.gray600).r, hexToRgb(COLORS.gray600).g, hexToRgb(COLORS.gray600).b);
    doc.text('Done', pageWidth - 90, currentWeekdayY + 18);
    
    // Skipped
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(hexToRgb('#EF4444').r, hexToRgb('#EF4444').g, hexToRgb('#EF4444').b);
    doc.text(`${skippedCount}`, pageWidth - 65, currentWeekdayY + 12);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(hexToRgb(COLORS.gray600).r, hexToRgb(COLORS.gray600).g, hexToRgb(COLORS.gray600).b);
    doc.text('Skipped', pageWidth - 65, currentWeekdayY + 18);
    
    // Open/Pending
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(hexToRgb('#F59E0B').r, hexToRgb('#F59E0B').g, hexToRgb('#F59E0B').b);
    doc.text(`${openCount}`, pageWidth - 40, currentWeekdayY + 12);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(hexToRgb(COLORS.gray600).r, hexToRgb(COLORS.gray600).g, hexToRgb(COLORS.gray600).b);
    doc.text('Open', pageWidth - 40, currentWeekdayY + 18);
    
    currentWeekdayY += weekdayCardHeight + 5; // Reduced from 10 to 5
  });
  
  // Services by Date Section
  const dateSectionY = currentWeekdayY + 20;
  
  // Section header
  doc.setTextColor(hexToRgb(COLORS.gray800).r, hexToRgb(COLORS.gray800).g, hexToRgb(COLORS.gray800).b);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Services by Date', 20, dateSectionY);
  
  // Add decorative line
  doc.setDrawColor(hexToRgb(COLORS.primary).r, hexToRgb(COLORS.primary).g, hexToRgb(COLORS.primary).b);
  doc.setLineWidth(2);
  doc.line(20, dateSectionY + 3, 60, dateSectionY + 3);
  
  // Services by Date - Card Layout
  const servicesByDateY = dateSectionY + 20;
  let currentY = servicesByDateY;
  
  // Process each date group
  normalizedData.servicesByWeekday.forEach((dayData, index) => {
    
    // Check if we need a new page
    if (currentY > pageHeight - 100) {
      doc.addPage();
      currentY = 30;
    }
    
    // Date card (similar to summary cards)
    const dateCardWidth = pageWidth - 40;
    const dateCardHeight = 25;
    
    // Card background
    drawRoundedRect(20, currentY, dateCardWidth, dateCardHeight, 8, COLORS.gray50, COLORS.gray200);
    
    // Date text
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(hexToRgb(COLORS.gray800).r, hexToRgb(COLORS.gray800).g, hexToRgb(COLORS.gray800).b);
    doc.text(dayData.date, 30, currentY + 15);
    
    // Calculate status breakdown (same as weekday cards)
    const completedCount = dayData.services.filter(s => s.status === 'Completed').length;
    const skippedCount = dayData.services.filter(s => s.status === 'Skipped').length;
    const openCount = dayData.services.filter(s => s.status === 'Open' || s.status === 'Pending').length;
    const totalScheduled = dayData.services.length; // This includes all statuses
    
    // First line: Total scheduled services
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(hexToRgb(COLORS.primary).r, hexToRgb(COLORS.primary).g, hexToRgb(COLORS.primary).b);
    doc.text(`${totalScheduled}`, pageWidth - 120, currentY + 12);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(hexToRgb(COLORS.gray600).r, hexToRgb(COLORS.gray600).g, hexToRgb(COLORS.gray600).b);
    doc.text('Scheduled', pageWidth - 120, currentY + 18);
    
    // Second line: Status breakdown
    // Completed
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(hexToRgb('#10B981').r, hexToRgb('#10B981').g, hexToRgb('#10B981').b);
    doc.text(`${completedCount}`, pageWidth - 90, currentY + 12);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(hexToRgb(COLORS.gray600).r, hexToRgb(COLORS.gray600).g, hexToRgb(COLORS.gray600).b);
    doc.text('Done', pageWidth - 90, currentY + 18);
    
    // Skipped
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(hexToRgb('#EF4444').r, hexToRgb('#EF4444').g, hexToRgb('#EF4444').b);
    doc.text(`${skippedCount}`, pageWidth - 65, currentY + 12);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(hexToRgb(COLORS.gray600).r, hexToRgb(COLORS.gray600).g, hexToRgb(COLORS.gray600).b);
    doc.text('Skipped', pageWidth - 65, currentY + 18);
    
    // Open/Pending
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(hexToRgb('#F59E0B').r, hexToRgb('#F59E0B').g, hexToRgb('#F59E0B').b);
    doc.text(`${openCount}`, pageWidth - 40, currentY + 12);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(hexToRgb(COLORS.gray600).r, hexToRgb(COLORS.gray600).g, hexToRgb(COLORS.gray600).b);
    doc.text('Open', pageWidth - 40, currentY + 18);
    
    currentY += dateCardHeight + 10;
    
    // Services list (if any services exist)
    if (dayData.services.length > 0) {
      // Sort services by completedAt before displaying (most recent first)
      const sortedServices = dayData.services.sort((a, b) => 
        new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
      );
      
      // Draw services in full-width format
      sortedServices.forEach((service) => {
        // Check if we need a new page
        if (currentY > pageHeight - 30) {
          doc.addPage();
          currentY = 30;
        }
        
        // Service item (full width)
        const serviceItemHeight = 15;
        
        // Service background (subtle)
        drawRoundedRect(20, currentY, dateCardWidth, serviceItemHeight, 4, COLORS.white, COLORS.gray100);
        
        // Status indicator (small dot)
        const statusColor = service.status === 'Completed' ? '#10B981' : 
                           service.status === 'Skipped' ? '#EF4444' : '#F59E0B';
        const statusRgb = hexToRgb(statusColor);
        doc.setFillColor(statusRgb.r, statusRgb.g, statusRgb.b);
        doc.circle(30, currentY + 7, 2, 'F');
        
        // Client name
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(hexToRgb(COLORS.gray800).r, hexToRgb(COLORS.gray800).g, hexToRgb(COLORS.gray800).b);
        doc.text(`${service.clientOwner.firstName} ${service.clientOwner.lastName}`, 40, currentY + 10);
        
        // Address (truncated)
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(hexToRgb(COLORS.gray600).r, hexToRgb(COLORS.gray600).g, hexToRgb(COLORS.gray600).b);
        const address = `${service.pool?.bodyOfWater} - ${service.pool.address}${service.pool?.addressLine2 ? ` ${service.pool?.addressLine2}` : ''} - ${service.serviceType.name} - $${service.paymentPerUnit?.toFixed(2) ?? '$0.00'}`
        // .length > 90 ? service.pool.address.substring(0, 90) + '...' : service.pool.address;
        doc.text(address, 40, currentY + 6);
        
        // Time (moved left to prevent overflow)
        const timeStr = service.completedAt ? format(new Date(service.completedAt), 'MMMM dd, yyyy h:mm a') : '';
        doc.text(timeStr, pageWidth - 90, currentY + 10);
        
        // Status badge (moved slightly right)
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        const statusWidth = doc.getTextWidth(service.status) + 4;
        const statusX = pageWidth - statusWidth - 30;
        
        // Status background
        doc.setFillColor(statusRgb.r, statusRgb.g, statusRgb.b);
        doc.roundedRect(statusX, currentY + 3, statusWidth, 8, 2, 2, 'F');
        
        // Status text
        doc.setTextColor(255, 255, 255);
        doc.text(service.status, statusX + 2, currentY + 8);
        
        currentY += serviceItemHeight + 3;
      });
    } else {
      // No services message
      doc.setFontSize(9);
      doc.setTextColor(hexToRgb(COLORS.gray500).r, hexToRgb(COLORS.gray500).g, hexToRgb(COLORS.gray500).b);
      doc.setFont('helvetica', 'italic');
      doc.text('No services scheduled for this date', 30, currentY + 8);
      currentY += 20;
    }
    
    // Add spacing between date groups
    currentY += 10;
  });
  
  // Footer
  const footerY = currentY + 30;
  
  // Add footer background
  drawRoundedRect(0, footerY, pageWidth, 25, 0, COLORS.gray100, COLORS.gray200);
  
  // Footer content
  doc.setFontSize(9);
  doc.setTextColor(hexToRgb(COLORS.gray600).r, hexToRgb(COLORS.gray600).g, hexToRgb(COLORS.gray600).b);
  doc.setFont('helvetica', 'normal');
  doc.text(`Report generated on ${format(new Date(), 'MMMM dd, yyyy')}`, 20, footerY + 5);
  
  // Add page number if on second page or more
  const pageCount = doc.getNumberOfPages();
  if (pageCount > 1) {
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(9);
      doc.setTextColor(hexToRgb(COLORS.gray500).r, hexToRgb(COLORS.gray500).g, hexToRgb(COLORS.gray500).b);
      doc.text(`Page ${i} of ${pageCount}`, pageWidth - 30, pageHeight - 10, { align: 'right' });
    }
  }
  
  // Save the PDF
  doc.save(`Aquatechy Report - ${reportData.technician} - ${format(fromDate, 'yyyy-MM-dd')} to ${format(toDate, 'yyyy-MM-dd')}.pdf`);
  } catch (error) {
    console.error('Error in PDF generation:', error);
    throw error;
  }
};
