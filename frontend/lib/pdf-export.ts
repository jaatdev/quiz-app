import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface QuestionDetail {
  id: string;
  text: string;
  options: { id: string; text: string }[];
  correctAnswerId: string;
  userAnswerId?: string;
  explanation?: string;
  pyqLabel?: string | null;
}

interface QuizResultData {
  topicName: string;
  subjectName: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  percentage: number;
  timeSpent: number;
  date: Date;
  questions?: QuestionDetail[]; // Optional detailed questions for PDF
}

export async function generateQuizResultPDF(result: QuizResultData) {
  console.log('generateQuizResultPDF called with:', result);
  
  try {
    // Just use the simple PDF instead - HTML2Canvas might be having issues
    console.log('Using simple PDF generation...');
    generateSimpleQuizPDF(result);
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}

// Alternative simple text-based PDF export
export function generateSimpleQuizPDF(result: QuizResultData) {
  console.log('generateSimpleQuizPDF called with:', result);
  
  const pdf = new jsPDF();
  console.log('Simple PDF instance created');
  
  let yPosition = 20;
  const lineHeight = 7;
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const marginLeft = 15;
  const marginRight = 15;
  const maxWidth = pageWidth - marginLeft - marginRight;
  
  // Helper function to add new page if needed
  const checkAddPage = (requiredSpace: number = 20) => {
    if (yPosition + requiredSpace > pageHeight - 20) {
      pdf.addPage();
      yPosition = 20;
      return true;
    }
    return false;
  };
  
  // Title
  pdf.setFontSize(24);
  pdf.setTextColor(44, 62, 80);
  pdf.text('Quiz Result Certificate', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += lineHeight * 2;
  
  // Date
  pdf.setFontSize(12);
  pdf.setTextColor(127, 140, 141);
  pdf.text(
    new Date(result.date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }), 
    pageWidth / 2, 
    yPosition, 
    { align: 'center' }
  );
  yPosition += lineHeight * 2;
  
  // Subject and Topic
  pdf.setFontSize(18);
  pdf.setTextColor(52, 73, 94);
  pdf.text(result.subjectName, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += lineHeight;
  
  pdf.setFontSize(14);
  pdf.text(result.topicName, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += lineHeight * 3;
  
  // Score Box
  pdf.setDrawColor(52, 152, 219);
  pdf.setLineWidth(2);
  pdf.rect(pageWidth / 2 - 40, yPosition - 10, 80, 40);
  
  pdf.setFontSize(28);
  pdf.setTextColor(52, 152, 219);
  pdf.text(`${result.percentage.toFixed(0)}%`, pageWidth / 2, yPosition + 10, { align: 'center' });
  yPosition += lineHeight * 5;
  
  // Statistics
  pdf.setFontSize(14);
  pdf.setTextColor(52, 73, 94);
  
  const stats = [
    `Total Questions: ${result.totalQuestions}`,
    `Correct Answers: ${result.correctAnswers}`,
    `Wrong Answers: ${result.totalQuestions - result.correctAnswers}`,
    `Final Score: ${result.score.toFixed(2)} / ${result.totalQuestions}`,
    `Time Taken: ${Math.floor(result.timeSpent / 60)}:${(result.timeSpent % 60).toString().padStart(2, '0')}`
  ];
  
  stats.forEach(stat => {
    pdf.text(stat, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += lineHeight;
  });
  
  yPosition += lineHeight * 2;
  
  // Grade
  let grade = 'A+';
  if (result.percentage < 90) grade = 'A';
  if (result.percentage < 80) grade = 'B';
  if (result.percentage < 70) grade = 'C';
  if (result.percentage < 60) grade = 'D';
  if (result.percentage < 50) grade = 'F';
  
  pdf.setFontSize(20);
  pdf.setTextColor(46, 204, 113);
  pdf.text(`Grade: ${grade}`, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += lineHeight * 3;
  
  // Performance message
  pdf.setFontSize(12);
  pdf.setTextColor(52, 73, 94);
  let message = '';
  if (result.percentage >= 80) {
    message = 'Excellent work! You have demonstrated strong knowledge.';
  } else if (result.percentage >= 60) {
    message = 'Good job! Keep practicing to improve further.';
  } else {
    message = 'Keep studying! Review the material to strengthen your understanding.';
  }
  
  const lines = pdf.splitTextToSize(message, pageWidth - 40);
  lines.forEach((line: string) => {
    pdf.text(line, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += lineHeight;
  });
  
  yPosition += lineHeight * 2;
  
  // Add detailed questions review if available
  if (result.questions && result.questions.length > 0) {
    checkAddPage(30);
    
    // Section header
    pdf.setFontSize(18);
    pdf.setTextColor(44, 62, 80);
    pdf.text('Detailed Review', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += lineHeight * 2;
    
    pdf.setDrawColor(52, 152, 219);
    pdf.setLineWidth(0.5);
    pdf.line(marginLeft, yPosition, pageWidth - marginRight, yPosition);
    yPosition += lineHeight * 2;
    
    // Iterate through each question
    result.questions.forEach((question, index) => {
      checkAddPage(50); // Ensure space for question
      
      const isCorrect = question.userAnswerId === question.correctAnswerId;
      
      // Draw border around entire question block
      const questionStartY = yPosition - 3;
      
      // Question number and status
      pdf.setFontSize(12);
      pdf.setTextColor(52, 73, 94);
      pdf.setFont(undefined, 'bold');
      
      const statusIcon = isCorrect ? '✓' : '✗';
      const statusColor = isCorrect ? [16, 185, 129] : [239, 68, 68]; // green or red
      
      pdf.text(`Question ${index + 1}:`, marginLeft + 2, yPosition);
      pdf.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
      pdf.text(statusIcon, marginLeft + 32, yPosition);
      yPosition += lineHeight;
      
      // Question text
      pdf.setFont(undefined, 'normal');
      pdf.setFontSize(11);
      pdf.setTextColor(52, 73, 94);
      const questionLines = pdf.splitTextToSize(question.text, maxWidth - 8);
      questionLines.forEach((line: string) => {
        checkAddPage();
        pdf.text(line, marginLeft + 2, yPosition);
        yPosition += lineHeight;
      });
      yPosition += lineHeight * 0.5;

      if (question.pyqLabel && question.pyqLabel.trim()) {
        checkAddPage();
        pdf.setFont(undefined, 'bold');
        pdf.setFontSize(10);
        pdf.setTextColor(217, 119, 6);
        pdf.text(`PYQ: ${question.pyqLabel.trim()}`, marginLeft + 2, yPosition);
        yPosition += lineHeight;
        pdf.setFont(undefined, 'normal');
        pdf.setTextColor(52, 73, 94);
      }
      
      // Calculate space needed for options
      const numOptions = question.options.length;
      const optionsBoxHeight = (numOptions * lineHeight) + 6; // 6 for padding
      const optionsBoxY = yPosition;
      
      // Draw background box for options first
      pdf.setDrawColor(180, 180, 180);
      pdf.setLineWidth(0.8);
      pdf.setFillColor(250, 250, 252);
      pdf.rect(marginLeft + 5, optionsBoxY, maxWidth - 10, optionsBoxHeight, 'FD');
      
      // Add top padding
      yPosition += 3;
      
      // Options
      pdf.setFontSize(10);
      question.options.forEach((option) => {
        checkAddPage();
        
        const isUserAnswer = option.id === question.userAnswerId;
        const isCorrectAnswer = option.id === question.correctAnswerId;
        
        let optionSymbol = '';
        let textColor: [number, number, number] = [52, 73, 94]; // default gray
        let isBold = false;
        
        // Determine symbol and color based on correct/user answer status
        if (isCorrectAnswer && isUserAnswer) {
          // User selected the correct answer - green with checkmark
          optionSymbol = '✓';
          textColor = [16, 185, 129]; // green
          isBold = true;
        } else if (isCorrectAnswer && !isUserAnswer) {
          // Correct answer but user didn't select it - green with checkmark
          optionSymbol = '✓';
          textColor = [16, 185, 129]; // green
          isBold = true;
        } else if (!isCorrectAnswer && isUserAnswer) {
          // User selected wrong answer - red with X
          optionSymbol = '✗';
          textColor = [239, 68, 68]; // red
          isBold = true;
        } else {
          // Not selected, not correct - gray circle
          optionSymbol = '○';
          textColor = [52, 73, 94]; // gray
          isBold = false;
        }
        
        if (isBold) {
          pdf.setFont(undefined, 'bold');
        } else {
          pdf.setFont(undefined, 'normal');
        }
        
        pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
        
        // Draw option with proper spacing
        const optionX = marginLeft + 8;
        const symbolX = optionX;
        const textX = optionX + 5;
        
        pdf.text(optionSymbol, symbolX, yPosition);
        pdf.text(option.text, textX, yPosition);
        yPosition += lineHeight;
        
        pdf.setFont(undefined, 'normal');
      });
      
      // Add bottom padding
      yPosition += 3;
      
      // User's answer indicator
      if (question.userAnswerId) {
        checkAddPage();
        pdf.setFontSize(9);
        pdf.setTextColor(100, 116, 139);
        pdf.setFont(undefined, 'italic');
        const userOption = question.options.find(opt => opt.id === question.userAnswerId);
        if (userOption) {
          pdf.text(`Your answer: ${userOption.text}`, marginLeft + 5, yPosition);
          yPosition += lineHeight;
        }
        pdf.setFont(undefined, 'normal');
      }
      
      // Explanation
      if (question.explanation) {
        checkAddPage(15);
        yPosition += lineHeight * 0.5;
        
        pdf.setFontSize(10);
        pdf.setTextColor(59, 130, 246); // blue
        pdf.setFont(undefined, 'bold');
        pdf.text('Explanation:', marginLeft + 5, yPosition);
        yPosition += lineHeight;
        
        pdf.setFont(undefined, 'normal');
        pdf.setTextColor(71, 85, 105);
        const explanationLines = pdf.splitTextToSize(question.explanation, maxWidth - 10);
        explanationLines.forEach((line: string) => {
          checkAddPage();
          pdf.text(line, marginLeft + 5, yPosition);
          yPosition += lineHeight;
        });
      }
      
      yPosition += lineHeight * 1.5;
      
      // Draw outer border around entire question block
      const questionEndY = yPosition;
      pdf.setDrawColor(100, 116, 139);
      pdf.setLineWidth(1);
      pdf.rect(marginLeft, questionStartY, maxWidth, questionEndY - questionStartY);
      
      yPosition += lineHeight * 0.5;
      
      // Separator line
      checkAddPage();
      pdf.setDrawColor(226, 232, 240);
      pdf.setLineWidth(0.3);
      pdf.line(marginLeft, yPosition, pageWidth - marginRight, yPosition);
      yPosition += lineHeight * 1.5;
    });
  }
  
  // Footer on last page
  const totalPages = (pdf as any).internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(10);
    pdf.setTextColor(127, 140, 141);
    pdf.text('Generated by QuizMaster Pro', pageWidth / 2, pageHeight - 10, { align: 'center' });
    pdf.setFontSize(8);
    pdf.text(`Page ${i} of ${totalPages}`, pageWidth - marginRight, pageHeight - 10, { align: 'right' });
  }
  
  // Save
  const fileName = `quiz-result-${result.subjectName.toLowerCase().replace(/\s+/g, '-')}-${new Date().getTime()}.pdf`;
  console.log('Saving simple PDF as:', fileName);
  pdf.save(fileName);
  console.log('Simple PDF saved successfully!');
}
