import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface QuizResultData {
  // User Info
  userName: string;
  userEmail: string;
  userImage?: string;
  
  // Quiz Info
  topicName: string;
  subjectName: string;
  difficulty: string;
  
  // Results
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  percentage: number;
  timeSpent: number;
  completedAt: Date;
  
  // Questions Detail
  questions?: Array<{
    questionNumber: number;
    questionText: string;
    options: Array<{
      id: string;
      text: string;
    }>;
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    explanation?: string;
  }>;
}

export async function generateProfessionalPDF(data: QuizResultData) {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  
  // Color scheme
  const primaryColor = [37, 99, 235]; // Blue
  const successColor = [34, 197, 94]; // Green
  const errorColor = [239, 68, 68]; // Red
  const grayColor = [107, 114, 128];
  
  // Helper function to add header on each page
  const addPageHeader = (pageNum: number) => {
    // Header background
    pdf.setFillColor(245, 247, 250);
    pdf.rect(0, 0, pageWidth, 30, 'F');
    
    // Logo/Brand
    pdf.setFontSize(16);
    pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    pdf.setFont('helvetica', 'bold');
    pdf.text('QuizMaster Pro', margin, 15);
    
    // Page number
    pdf.setFontSize(10);
    pdf.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Page ${pageNum}`, pageWidth - margin, 15, { align: 'right' });
    
    // Header line
    pdf.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    pdf.setLineWidth(0.5);
    pdf.line(margin, 25, pageWidth - margin, 25);
  };
  
  // Page 1: Certificate/Summary Page
  addPageHeader(1);
  
  let yPos = 45;
  
  // Title
  pdf.setFontSize(24);
  pdf.setTextColor(33, 33, 33);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Quiz Performance Report', pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 15;
  
  // User Info Section
  pdf.setFillColor(250, 251, 252);
  pdf.roundedRect(margin, yPos, contentWidth, 30, 3, 3, 'F');
  
  // User details
  pdf.setFontSize(12);
  pdf.setTextColor(33, 33, 33);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Candidate Information', margin + 5, yPos + 8);
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.text(`Name: ${data.userName}`, margin + 5, yPos + 16);
  pdf.text(`Email: ${data.userEmail}`, margin + 5, yPos + 23);
  pdf.text(`Date: ${data.completedAt.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })}`, pageWidth / 2, yPos + 16);
  pdf.text(`Time: ${data.completedAt.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  })}`, pageWidth / 2, yPos + 23);
  
  yPos += 40;
  
  // Quiz Info Section
  pdf.setFillColor(250, 251, 252);
  pdf.roundedRect(margin, yPos, contentWidth, 25, 3, 3, 'F');
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.text('Quiz Details', margin + 5, yPos + 8);
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.text(`Subject: ${data.subjectName}`, margin + 5, yPos + 16);
  pdf.text(`Topic: ${data.topicName}`, margin + 5, yPos + 23);
  pdf.text(`Difficulty: ${data.difficulty.charAt(0).toUpperCase() + data.difficulty.slice(1)}`, pageWidth / 2, yPos + 16);
  pdf.text(`Duration: ${Math.floor(data.timeSpent / 60)}m ${data.timeSpent % 60}s`, pageWidth / 2, yPos + 23);
  
  yPos += 35;
  
  // Score Card - Main Result
  const scoreCardHeight = 60;
  
  // Determine grade and color
  let grade = 'A+';
  let gradeColor = successColor;
  if (data.percentage < 90) { grade = 'A'; }
  if (data.percentage < 80) { grade = 'B'; gradeColor = primaryColor; }
  if (data.percentage < 70) { grade = 'C'; gradeColor = [251, 146, 60]; }
  if (data.percentage < 60) { grade = 'D'; gradeColor = [251, 146, 60]; }
  if (data.percentage < 50) { grade = 'F'; gradeColor = errorColor; }
  
  // Main score box
  pdf.setFillColor(gradeColor[0], gradeColor[1], gradeColor[2]);
  pdf.roundedRect(margin, yPos, contentWidth, scoreCardHeight, 5, 5, 'F');
  
  // Score content
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(36);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`${data.percentage.toFixed(1)}%`, pageWidth / 2, yPos + 25, { align: 'center' });
  
  pdf.setFontSize(20);
  pdf.text(`Grade: ${grade}`, pageWidth / 2, yPos + 40, { align: 'center' });
  
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Score: ${data.score.toFixed(2)} / ${data.totalQuestions}`, pageWidth / 2, yPos + 52, { align: 'center' });
  
  yPos += scoreCardHeight + 15;
  
  // Statistics Grid
  const statBoxWidth = (contentWidth - 10) / 3;
  const statBoxHeight = 35;
  
  // Correct Answers Box
  pdf.setFillColor(successColor[0], successColor[1], successColor[2], 20);
  pdf.setDrawColor(successColor[0], successColor[1], successColor[2]);
  pdf.setLineWidth(0.5);
  pdf.roundedRect(margin, yPos, statBoxWidth, statBoxHeight, 3, 3, 'FD');
  
  pdf.setTextColor(successColor[0], successColor[1], successColor[2]);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Correct', margin + statBoxWidth/2, yPos + 10, { align: 'center' });
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.text(data.correctAnswers.toString(), margin + statBoxWidth/2, yPos + 22, { align: 'center' });
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.text('questions', margin + statBoxWidth/2, yPos + 29, { align: 'center' });
  
  // Incorrect Answers Box
  pdf.setFillColor(errorColor[0], errorColor[1], errorColor[2], 20);
  pdf.setDrawColor(errorColor[0], errorColor[1], errorColor[2]);
  pdf.roundedRect(margin + statBoxWidth + 5, yPos, statBoxWidth, statBoxHeight, 3, 3, 'FD');
  
  pdf.setTextColor(errorColor[0], errorColor[1], errorColor[2]);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Incorrect', margin + statBoxWidth + 5 + statBoxWidth/2, yPos + 10, { align: 'center' });
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.text(data.incorrectAnswers.toString(), margin + statBoxWidth + 5 + statBoxWidth/2, yPos + 22, { align: 'center' });
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.text('questions', margin + statBoxWidth + 5 + statBoxWidth/2, yPos + 29, { align: 'center' });
  
  // Unattempted Box
  const unattempted = data.totalQuestions - data.correctAnswers - data.incorrectAnswers;
  pdf.setFillColor(grayColor[0], grayColor[1], grayColor[2], 20);
  pdf.setDrawColor(grayColor[0], grayColor[1], grayColor[2]);
  pdf.roundedRect(margin + (statBoxWidth + 5) * 2, yPos, statBoxWidth, statBoxHeight, 3, 3, 'FD');
  
  pdf.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Skipped', margin + (statBoxWidth + 5) * 2 + statBoxWidth/2, yPos + 10, { align: 'center' });
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.text(unattempted.toString(), margin + (statBoxWidth + 5) * 2 + statBoxWidth/2, yPos + 22, { align: 'center' });
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.text('questions', margin + (statBoxWidth + 5) * 2 + statBoxWidth/2, yPos + 29, { align: 'center' });
  
  yPos += statBoxHeight + 15;
  
  // Performance Message
  let message = '';
  if (data.percentage >= 80) {
    message = 'Excellent work! You have demonstrated strong knowledge in this topic.';
  } else if (data.percentage >= 60) {
    message = 'Good job! Keep practicing to improve your understanding further.';
  } else {
    message = 'Keep studying! Review the explanations to strengthen your knowledge.';
  }
  
  pdf.setFillColor(245, 247, 250);
  pdf.roundedRect(margin, yPos, contentWidth, 25, 3, 3, 'F');
  pdf.setTextColor(33, 33, 33);
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'italic');
  
  const lines = pdf.splitTextToSize(message, contentWidth - 10);
  let messageY = yPos + 10;
  lines.forEach((line: string) => {
    pdf.text(line, pageWidth / 2, messageY, { align: 'center' });
    messageY += 6;
  });
  
  // Footer
  pdf.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.text('This is a computer-generated report and does not require a signature.', pageWidth / 2, pageHeight - 10, { align: 'center' });
  
  // Page 2 onwards: Question-wise Analysis
  if (data.questions && data.questions.length > 0) {
    pdf.addPage();
    let currentPage = 2;
    addPageHeader(currentPage);
    
    yPos = 40;
    
    // Section Title
    pdf.setFontSize(18);
    pdf.setTextColor(33, 33, 33);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Question-wise Analysis', margin, yPos);
    
    yPos += 10;
    
    // Questions
    for (let i = 0; i < data.questions.length; i++) {
      const question = data.questions[i];
      
      // Check if we need a new page
      if (yPos > pageHeight - 60) {
        pdf.addPage();
        currentPage++;
        addPageHeader(currentPage);
        yPos = 40;
      }
      
      // Question header
      const questionBgColor = question.isCorrect 
        ? [220, 252, 231] // Light green
        : [254, 226, 226]; // Light red
      
      pdf.setFillColor(questionBgColor[0], questionBgColor[1], questionBgColor[2]);
      pdf.roundedRect(margin, yPos, contentWidth, 10, 2, 2, 'F');
      
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(33, 33, 33);
      pdf.text(`Question ${question.questionNumber}`, margin + 3, yPos + 7);
      
      // Status badge
      if (question.isCorrect) {
        pdf.setTextColor(successColor[0], successColor[1], successColor[2]);
        pdf.text('✓ Correct', pageWidth - margin - 3, yPos + 7, { align: 'right' });
      } else {
        pdf.setTextColor(errorColor[0], errorColor[1], errorColor[2]);
        pdf.text('✗ Incorrect', pageWidth - margin - 3, yPos + 7, { align: 'right' });
      }
      
      yPos += 14;
      
      // Question text
      pdf.setTextColor(33, 33, 33);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      const questionLines = pdf.splitTextToSize(question.questionText, contentWidth - 6);
      questionLines.forEach((line: string) => {
        pdf.text(line, margin + 3, yPos);
        yPos += 5;
      });
      
      yPos += 3;
      
      // Options
      question.options.forEach((option) => {
        const isUserAnswer = option.id === question.userAnswer;
        const isCorrectAnswer = option.id === question.correctAnswer;
        const wasNotAnswered = question.userAnswer === 'not-answered';
        
        // Debug logging
        console.log(`  Option ${option.id}:`, {
          isUserAnswer,
          isCorrectAnswer,
          userAnswer: question.userAnswer,
          correctAnswer: question.correctAnswer,
          wasNotAnswered
        });
        
        // Option background
        if (isCorrectAnswer) {
          pdf.setFillColor(successColor[0], successColor[1], successColor[2], 30);
          pdf.roundedRect(margin + 3, yPos - 4, contentWidth - 6, 7, 1, 1, 'F');
        } else if (isUserAnswer && !isCorrectAnswer && !wasNotAnswered) {
          pdf.setFillColor(errorColor[0], errorColor[1], errorColor[2], 30);
          pdf.roundedRect(margin + 3, yPos - 4, contentWidth - 6, 7, 1, 1, 'F');
        }
        
        // Option text
        pdf.setFontSize(9);
        let optionPrefix = `${option.id.toUpperCase()}. `;
        
        if (isCorrectAnswer) {
          pdf.setTextColor(successColor[0], successColor[1], successColor[2]);
          pdf.setFont('helvetica', 'bold');
          optionPrefix = `✓ ${optionPrefix}`;
        } else if (isUserAnswer && !isCorrectAnswer && !wasNotAnswered) {
          pdf.setTextColor(errorColor[0], errorColor[1], errorColor[2]);
          pdf.setFont('helvetica', 'bold');
          optionPrefix = `✗ ${optionPrefix}`;
        } else {
          pdf.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
          pdf.setFont('helvetica', 'normal');
        }
        
        pdf.text(`${optionPrefix}${option.text}`, margin + 6, yPos);
        yPos += 7;
      });
      
      // Explanation (if incorrect)
      if (!question.isCorrect && question.explanation) {
        yPos += 2;
        pdf.setFillColor(250, 251, 252);
        pdf.roundedRect(margin + 3, yPos - 3, contentWidth - 6, 15, 2, 2, 'F');
        
        pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Explanation:', margin + 6, yPos);
        
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
        const explainLines = pdf.splitTextToSize(question.explanation, contentWidth - 12);
        yPos += 4;
        explainLines.forEach((line: string) => {
          pdf.text(line, margin + 6, yPos);
          yPos += 4;
        });
        yPos += 2;
      }
      
      yPos += 8; // Space between questions
    }
  }
  
  // Save the PDF
  const fileName = `quiz-report-${data.subjectName.toLowerCase().replace(/\s+/g, '-')}-${new Date().getTime()}.pdf`;
  pdf.save(fileName);
}
