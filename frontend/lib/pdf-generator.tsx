import jsPDF from 'jspdf';

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
    const detailLineHeight = 5;
    for (let i = 0; i < data.questions.length; i++) {
      const question = data.questions[i];
      const wasSkipped = !question.userAnswer || question.userAnswer === 'not-answered';

      if (yPos > pageHeight - 80) {
        pdf.addPage();
        currentPage++;
        addPageHeader(currentPage);
        yPos = 40;
      }

      const headerBgColor = wasSkipped
        ? [241, 245, 249]
        : question.isCorrect
        ? [220, 252, 231]
        : [254, 226, 226];

      const statusLabel = wasSkipped
        ? 'Status: Skipped'
        : question.isCorrect
        ? 'Status: Correct'
        : 'Status: Incorrect';

      const statusColor = wasSkipped ? grayColor : question.isCorrect ? successColor : errorColor;

      pdf.setFillColor(headerBgColor[0], headerBgColor[1], headerBgColor[2]);
      pdf.roundedRect(margin, yPos, contentWidth, 10, 2, 2, 'F');

      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(33, 33, 33);
      pdf.text(`Question ${question.questionNumber}`, margin + 3, yPos + 7);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
      pdf.text(statusLabel, pageWidth - margin - 3, yPos + 7, { align: 'right' });

      yPos += 14;

      pdf.setTextColor(33, 33, 33);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      const questionLines = pdf.splitTextToSize(question.questionText, contentWidth - 6);
      questionLines.forEach((line: string) => {
        if (yPos > pageHeight - 40) {
          pdf.addPage();
          currentPage++;
          addPageHeader(currentPage);
          yPos = 40;
        }
        pdf.text(line, margin + 3, yPos);
        yPos += detailLineHeight;
      });

      yPos += 3;

      question.options.forEach((option, optionIndex) => {
        if (yPos > pageHeight - 40) {
          pdf.addPage();
          currentPage++;
          addPageHeader(currentPage);
          yPos = 40;
        }

        const isUserAnswer = option.id === question.userAnswer;
        const isCorrectAnswer = option.id === question.correctAnswer;
        const optionLabel = option.id && option.id.trim().length > 0
          ? option.id.trim().toUpperCase()
          : String.fromCharCode(65 + optionIndex);

        const optionBadges: string[] = [];
        if (isCorrectAnswer) {
          optionBadges.push('Correct answer');
        }
        if (isUserAnswer && !wasSkipped) {
          optionBadges.push('Your answer');
        }

        let optionLine = `${optionLabel}. ${option.text}`;
        if (optionBadges.length > 0) {
          optionLine += ` [${optionBadges.join(', ')}]`;
        }

        const optionLines = pdf.splitTextToSize(optionLine, contentWidth - 16);
        const optionBlockHeight = optionLines.length * detailLineHeight + 6;

        if (isCorrectAnswer || (isUserAnswer && !isCorrectAnswer && !wasSkipped)) {
          const highlightColor = isCorrectAnswer
            ? [222, 247, 236]
            : [254, 226, 226];
          pdf.setFillColor(highlightColor[0], highlightColor[1], highlightColor[2]);
          pdf.roundedRect(margin + 3, yPos, contentWidth - 6, optionBlockHeight, 2, 2, 'F');
        }

        let optionTextColor: [number, number, number] = [grayColor[0], grayColor[1], grayColor[2]];
        let optionFont: 'bold' | 'normal' = 'normal';
        if (isCorrectAnswer) {
          optionTextColor = [successColor[0], successColor[1], successColor[2]];
          optionFont = 'bold';
        } else if (isUserAnswer && !isCorrectAnswer && !wasSkipped) {
          optionTextColor = [errorColor[0], errorColor[1], errorColor[2]];
          optionFont = 'bold';
        }

        pdf.setFont('helvetica', optionFont);
        pdf.setFontSize(9);
        pdf.setTextColor(optionTextColor[0], optionTextColor[1], optionTextColor[2]);

        let optionTextY = yPos + 4;
        optionLines.forEach((line: string) => {
          pdf.text(line, margin + 6, optionTextY);
          optionTextY += detailLineHeight;
        });

        yPos += optionBlockHeight + 3;

        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(33, 33, 33);
      });

      const userAnswerOption = question.options.find((option) => option.id === question.userAnswer);
      const correctAnswerOption = question.options.find((option) => option.id === question.correctAnswer);

      const userAnswerText = wasSkipped ? 'Not answered' : userAnswerOption?.text ?? 'Not answered';
      const correctAnswerText = correctAnswerOption?.text ?? 'Unavailable';

      const summaryGap = 6;
      const summaryWidth = (contentWidth - summaryGap) / 2;

      const userAnswerLines = pdf.splitTextToSize(userAnswerText, summaryWidth - 10);
      const correctAnswerLines = pdf.splitTextToSize(correctAnswerText, summaryWidth - 10);

      const userBoxHeight = 14 + userAnswerLines.length * detailLineHeight;
      const correctBoxHeight = 14 + correctAnswerLines.length * detailLineHeight;
      const summaryBoxHeight = Math.max(userBoxHeight, correctBoxHeight);

      if (yPos + summaryBoxHeight > pageHeight - 40) {
        pdf.addPage();
        currentPage++;
        addPageHeader(currentPage);
        yPos = 40;
      }

      const userFill = wasSkipped
        ? [255, 255, 255]
        : question.isCorrect
        ? [222, 247, 236]
        : [254, 226, 226];
      const userStroke = wasSkipped
        ? [203, 213, 225]
        : question.isCorrect
        ? [successColor[0], successColor[1], successColor[2]]
        : [errorColor[0], errorColor[1], errorColor[2]];
      const userValueColor = wasSkipped
        ? [71, 85, 105]
        : question.isCorrect
        ? [17, 94, 89]
        : [153, 27, 27];

      pdf.setFillColor(userFill[0], userFill[1], userFill[2]);
      pdf.setDrawColor(userStroke[0], userStroke[1], userStroke[2]);
      pdf.roundedRect(margin + 3, yPos, summaryWidth, summaryBoxHeight, 2, 2, 'FD');

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.setTextColor(107, 114, 128);
      pdf.text('Your answer', margin + 7, yPos + 6);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(userValueColor[0], userValueColor[1], userValueColor[2]);
      let answerTextY = yPos + 12;
      userAnswerLines.forEach((line: string) => {
        pdf.text(line, margin + 7, answerTextY);
        answerTextY += detailLineHeight;
      });

      const correctFill = [222, 247, 236];
      const correctStroke = [successColor[0], successColor[1], successColor[2]];

      pdf.setFillColor(correctFill[0], correctFill[1], correctFill[2]);
      pdf.setDrawColor(correctStroke[0], correctStroke[1], correctStroke[2]);
      pdf.roundedRect(margin + 3 + summaryWidth + summaryGap, yPos, summaryWidth, summaryBoxHeight, 2, 2, 'FD');

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.setTextColor(107, 114, 128);
      pdf.text('Correct answer', margin + 7 + summaryWidth + summaryGap, yPos + 6);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(17, 94, 89);
      let correctTextY = yPos + 12;
      correctAnswerLines.forEach((line: string) => {
        pdf.text(line, margin + 7 + summaryWidth + summaryGap, correctTextY);
        correctTextY += detailLineHeight;
      });

      yPos += summaryBoxHeight + 8;

      if (question.explanation) {
        const explanationLines = pdf.splitTextToSize(question.explanation, contentWidth - 14);
        const explanationHeight = 12 + explanationLines.length * detailLineHeight;

        if (yPos + explanationHeight > pageHeight - 40) {
          pdf.addPage();
          currentPage++;
          addPageHeader(currentPage);
          yPos = 40;
        }

        pdf.setFillColor(245, 247, 250);
        pdf.roundedRect(margin + 3, yPos, contentWidth - 6, explanationHeight, 2, 2, 'F');

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9);
        pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        pdf.text('Explanation', margin + 7, yPos + 6);

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
        let explanationY = yPos + 12;
        explanationLines.forEach((line: string) => {
          if (explanationY > pageHeight - 20) {
            pdf.addPage();
            currentPage++;
            addPageHeader(currentPage);
            explanationY = 40;
          }
          pdf.text(line, margin + 7, explanationY);
          explanationY += detailLineHeight;
        });

        yPos += explanationHeight + 8;
      } else {
        yPos += 8;
      }
    }
  }
  
  // Save the PDF
  const fileName = `quiz-report-${data.subjectName.toLowerCase().replace(/\s+/g, '-')}-${new Date().getTime()}.pdf`;
  pdf.save(fileName);
}
