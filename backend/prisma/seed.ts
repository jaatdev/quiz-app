import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing data
  await prisma.question.deleteMany();
  await prisma.topic.deleteMany();
  await prisma.subject.deleteMany();

  console.log('🗑️  Cleared existing data');

  // Create JavaScript subject with topics and questions
  const javascript = await prisma.subject.create({
    data: {
      name: 'JavaScript',
      topics: {
        create: [
          {
            name: 'Fundamentals',
            questions: {
              create: [
                {
                  text: 'What is the correct way to declare a constant in JavaScript?',
                  options: [
                    { id: 'a', text: 'var PI = 3.14;' },
                    { id: 'b', text: 'let PI = 3.14;' },
                    { id: 'c', text: 'const PI = 3.14;' },
                    { id: 'd', text: 'constant PI = 3.14;' }
                  ],
                  correctAnswerId: 'c',
                  explanation: 'The const keyword is used to declare constants in JavaScript.',
                  difficulty: 'easy'
                },
                {
                  text: 'Which method removes the last element from an array?',
                  options: [
                    { id: 'a', text: 'push()' },
                    { id: 'b', text: 'pop()' },
                    { id: 'c', text: 'shift()' },
                    { id: 'd', text: 'unshift()' }
                  ],
                  correctAnswerId: 'b',
                  explanation: 'The pop() method removes and returns the last element from an array.',
                  difficulty: 'easy'
                },
                {
                  text: 'What does typeof null return?',
                  options: [
                    { id: 'a', text: '"null"' },
                    { id: 'b', text: '"undefined"' },
                    { id: 'c', text: '"object"' },
                    { id: 'd', text: '"number"' }
                  ],
                  correctAnswerId: 'c',
                  explanation: 'This is a known quirk in JavaScript - typeof null returns "object".',
                  difficulty: 'medium'
                },
                {
                  text: 'Which statement creates a new array with all elements that pass a test?',
                  options: [
                    { id: 'a', text: 'map()' },
                    { id: 'b', text: 'filter()' },
                    { id: 'c', text: 'reduce()' },
                    { id: 'd', text: 'forEach()' }
                  ],
                  correctAnswerId: 'b',
                  explanation: 'The filter() method creates a new array with all elements that pass the test implemented by the provided function.',
                  difficulty: 'medium'
                },
                {
                  text: 'What is the result of 3 + 2 + "7"?',
                  options: [
                    { id: 'a', text: '12' },
                    { id: 'b', text: '"57"' },
                    { id: 'c', text: '"327"' },
                    { id: 'd', text: '57' }
                  ],
                  correctAnswerId: 'b',
                  explanation: '3 + 2 equals 5, then 5 + "7" results in string concatenation: "57".',
                  difficulty: 'medium'
                },
                {
                  text: 'Which keyword is used to create a function in JavaScript?',
                  options: [
                    { id: 'a', text: 'func' },
                    { id: 'b', text: 'function' },
                    { id: 'c', text: 'def' },
                    { id: 'd', text: 'fn' }
                  ],
                  correctAnswerId: 'b',
                  explanation: 'The "function" keyword is used to define functions in JavaScript.',
                  difficulty: 'easy'
                },
                {
                  text: 'What does === operator do in JavaScript?',
                  options: [
                    { id: 'a', text: 'Assigns a value' },
                    { id: 'b', text: 'Compares values only' },
                    { id: 'c', text: 'Compares values and types' },
                    { id: 'd', text: 'Logical AND' }
                  ],
                  correctAnswerId: 'c',
                  explanation: 'The === operator checks for strict equality, comparing both value and type.',
                  difficulty: 'easy'
                },
                {
                  text: 'What will console.log(1 + "1") output?',
                  options: [
                    { id: 'a', text: '2' },
                    { id: 'b', text: '"11"' },
                    { id: 'c', text: '"2"' },
                    { id: 'd', text: 'NaN' }
                  ],
                  correctAnswerId: 'b',
                  explanation: 'When adding a number and string, JavaScript converts the number to a string and concatenates them.',
                  difficulty: 'medium'
                },
                {
                  text: 'Which method converts JSON string to JavaScript object?',
                  options: [
                    { id: 'a', text: 'JSON.stringify()' },
                    { id: 'b', text: 'JSON.parse()' },
                    { id: 'c', text: 'JSON.convert()' },
                    { id: 'd', text: 'JSON.toObject()' }
                  ],
                  correctAnswerId: 'b',
                  explanation: 'JSON.parse() converts a JSON string into a JavaScript object.',
                  difficulty: 'easy'
                },
                {
                  text: 'What is the output of Boolean("false")?',
                  options: [
                    { id: 'a', text: 'false' },
                    { id: 'b', text: 'true' },
                    { id: 'c', text: 'undefined' },
                    { id: 'd', text: 'Error' }
                  ],
                  correctAnswerId: 'b',
                  explanation: 'Any non-empty string is truthy in JavaScript, so Boolean("false") returns true.',
                  difficulty: 'hard'
                }
              ]
            }
          },
          {
            name: 'ES6 Features',
            questions: {
              create: [
                {
                  text: 'What is the correct syntax for arrow function?',
                  options: [
                    { id: 'a', text: 'function => {}' },
                    { id: 'b', text: '() => {}' },
                    { id: 'c', text: '=> () {}' },
                    { id: 'd', text: 'func() => {}' }
                  ],
                  correctAnswerId: 'b',
                  explanation: 'Arrow functions use the syntax: () => {}',
                  difficulty: 'easy'
                },
                {
                  text: 'What does the spread operator (...) do?',
                  options: [
                    { id: 'a', text: 'Multiplies numbers' },
                    { id: 'b', text: 'Expands iterables' },
                    { id: 'c', text: 'Creates comments' },
                    { id: 'd', text: 'Repeats strings' }
                  ],
                  correctAnswerId: 'b',
                  explanation: 'The spread operator expands an iterable (like an array) into individual elements.',
                  difficulty: 'medium'
                },
                {
                  text: 'What is template literal syntax?',
                  options: [
                    { id: 'a', text: '"string"' },
                    { id: 'b', text: '\'string\'' },
                    { id: 'c', text: '`string`' },
                    { id: 'd', text: '|string|' }
                  ],
                  correctAnswerId: 'c',
                  explanation: 'Template literals use backticks (`) and allow embedded expressions with ${}.',
                  difficulty: 'easy'
                },
                {
                  text: 'What does destructuring do?',
                  options: [
                    { id: 'a', text: 'Deletes variables' },
                    { id: 'b', text: 'Extracts values from arrays/objects' },
                    { id: 'c', text: 'Creates new objects' },
                    { id: 'd', text: 'Breaks the code' }
                  ],
                  correctAnswerId: 'b',
                  explanation: 'Destructuring allows unpacking values from arrays or properties from objects into distinct variables.',
                  difficulty: 'medium'
                },
                {
                  text: 'What is the purpose of Promise?',
                  options: [
                    { id: 'a', text: 'To handle synchronous code' },
                    { id: 'b', text: 'To handle asynchronous operations' },
                    { id: 'c', text: 'To create loops' },
                    { id: 'd', text: 'To define classes' }
                  ],
                  correctAnswerId: 'b',
                  explanation: 'Promises are used to handle asynchronous operations in JavaScript.',
                  difficulty: 'medium'
                }
              ]
            }
          }
        ]
      }
    }
  });

  // Create React subject
  const react = await prisma.subject.create({
    data: {
      name: 'React',
      topics: {
        create: [
          {
            name: 'React Basics',
            questions: {
              create: [
                {
                  text: 'What is JSX?',
                  options: [
                    { id: 'a', text: 'JavaScript XML' },
                    { id: 'b', text: 'Java Syntax Extension' },
                    { id: 'c', text: 'JSON Extension' },
                    { id: 'd', text: 'JavaScript Extension' }
                  ],
                  correctAnswerId: 'a',
                  explanation: 'JSX stands for JavaScript XML, a syntax extension for JavaScript.',
                  difficulty: 'easy'
                },
                {
                  text: 'Which hook is used for side effects?',
                  options: [
                    { id: 'a', text: 'useState' },
                    { id: 'b', text: 'useEffect' },
                    { id: 'c', text: 'useContext' },
                    { id: 'd', text: 'useReducer' }
                  ],
                  correctAnswerId: 'b',
                  explanation: 'useEffect is used for side effects like data fetching, subscriptions, etc.',
                  difficulty: 'easy'
                },
                {
                  text: 'What does useState return?',
                  options: [
                    { id: 'a', text: 'A single value' },
                    { id: 'b', text: 'An array with state and setter' },
                    { id: 'c', text: 'An object' },
                    { id: 'd', text: 'A function' }
                  ],
                  correctAnswerId: 'b',
                  explanation: 'useState returns an array with two elements: current state and a function to update it.',
                  difficulty: 'easy'
                },
                {
                  text: 'What is the virtual DOM?',
                  options: [
                    { id: 'a', text: 'A real DOM copy' },
                    { id: 'b', text: 'A lightweight copy of real DOM' },
                    { id: 'c', text: 'A database' },
                    { id: 'd', text: 'A server' }
                  ],
                  correctAnswerId: 'b',
                  explanation: 'Virtual DOM is a lightweight copy of the actual DOM kept in memory.',
                  difficulty: 'medium'
                },
                {
                  text: 'What is prop drilling?',
                  options: [
                    { id: 'a', text: 'Creating props' },
                    { id: 'b', text: 'Passing props through multiple levels' },
                    { id: 'c', text: 'Deleting props' },
                    { id: 'd', text: 'Validating props' }
                  ],
                  correctAnswerId: 'b',
                  explanation: 'Prop drilling is passing data from a parent to a deeply nested child through multiple intermediate components.',
                  difficulty: 'medium'
                }
              ]
            }
          }
        ]
      }
    }
  });

  console.log('✅ Seed data created successfully');
  console.log(`📚 Created ${await prisma.subject.count()} subjects`);
  console.log(`📑 Created ${await prisma.topic.count()} topics`);
  console.log(`❓ Created ${await prisma.question.count()} questions`);

  // Create multilingual quizzes
  console.log('\n🌍 Creating multilingual quizzes...');

  const indiaGKQuiz = await prisma.multilingualQuiz.create({
    data: {
      title: {
        en: 'India General Knowledge',
        hi: 'भारत सामान्य ज्ञान',
        es: 'Conocimiento General de India',
        fr: 'Connaissances Générales sur l\'Inde'
      },
      description: {
        en: 'Test your knowledge about India - geography, history, culture, and more!',
        hi: 'भारत के बारे में अपने ज्ञान का परीक्षण करें - भूगोल, इतिहास, संस्कृति और बहुत कुछ!',
        es: '¡Prueba tus conocimientos sobre India - geografía, historia, cultura y más!',
        fr: 'Testez vos connaissances sur l\'Inde - géographie, histoire, culture et bien plus!'
      },
      category: 'Geography',
      difficulty: 'medium',
      timeLimit: 10,
      availableLanguages: ['en', 'hi', 'es', 'fr'],
      defaultLanguage: 'en',
      tags: ['india', 'general-knowledge', 'geography', 'history'],
      createdBy: 'system',
      questions: {
        create: [
          {
            sequenceNumber: 1,
            question: {
              en: 'What is the capital of India?',
              hi: 'भारत की राजधानी क्या है?',
              es: '¿Cuál es la capital de India?',
              fr: 'Quelle est la capitale de l\'Inde?'
            },
            options: {
              en: ['Mumbai', 'New Delhi', 'Kolkata', 'Chennai'],
              hi: ['मुंबई', 'नई दिल्ली', 'कोलकाता', 'चेन्नई'],
              es: ['Bombay', 'Nueva Delhi', 'Calcuta', 'Chennai'],
              fr: ['Bombay', 'Nouvelle Delhi', 'Calcutta', 'Chennai']
            },
            correctAnswer: 1,
            explanation: {
              en: 'New Delhi has been the capital of India since 1911.',
              hi: 'नई दिल्ली 1911 से भारत की राजधानी है।',
              es: 'Nueva Delhi ha sido la capital de India desde 1911.',
              fr: 'Nouvelle Delhi est la capitale de l\'Inde depuis 1911.'
            },
            points: 10,
            category: 'Geography'
          },
          {
            sequenceNumber: 2,
            question: {
              en: 'In which year did India gain independence?',
              hi: 'भारत को किस वर्ष आजादी मिली?',
              es: '¿En qué año ganó independencia India?',
              fr: 'En quelle année l\'Inde a-t-elle obtenu son indépendance?'
            },
            options: {
              en: ['1945', '1947', '1950', '1952'],
              hi: ['1945', '1947', '1950', '1952'],
              es: ['1945', '1947', '1950', '1952'],
              fr: ['1945', '1947', '1950', '1952']
            },
            correctAnswer: 1,
            explanation: {
              en: 'India gained independence on August 15, 1947.',
              hi: 'भारत को 15 अगस्त 1947 को आजादी मिली।',
              es: 'India ganó la independencia el 15 de agosto de 1947.',
              fr: 'L\'Inde a obtenu l\'indépendance le 15 août 1947.'
            },
            points: 10,
            category: 'History'
          },
          {
            sequenceNumber: 3,
            question: {
              en: 'What is the national flower of India?',
              hi: 'भारत का राष्ट्रीय फूल क्या है?',
              es: '¿Cuál es la flor nacional de India?',
              fr: 'Quelle est la fleur nationale de l\'Inde?'
            },
            options: {
              en: ['Rose', 'Lotus', 'Jasmine', 'Marigold'],
              hi: ['गुलाब', 'कमल', 'चमेली', 'गेंदा'],
              es: ['Rosa', 'Loto', 'Jazmín', 'Caléndula'],
              fr: ['Rose', 'Lotus', 'Jasmin', 'Calendula']
            },
            correctAnswer: 1,
            explanation: {
              en: 'The Lotus is the national flower of India, symbolizing purity and enlightenment.',
              hi: 'कमल भारत का राष्ट्रीय फूल है, जो शुद्धता और ज्ञान का प्रतीक है।',
              es: 'El loto es la flor nacional de India, simbolizando pureza e iluminación.',
              fr: 'Le lotus est la fleur nationale de l\'Inde, symbolisant la pureté et l\'illumination.'
            },
            points: 10,
            category: 'Culture'
          }
        ]
      }
    }
  });

  const mathQuiz = await prisma.multilingualQuiz.create({
    data: {
      title: {
        en: 'Mathematics Basics',
        hi: 'गणित मूलभूत',
        es: 'Conceptos Básicos de Matemáticas',
        fr: 'Concepts Mathématiques de Base'
      },
      description: {
        en: 'Test your mathematical skills with basic arithmetic problems.',
        hi: 'बुनियादी अंकगणित समस्याओं के साथ अपने गणितीय कौशल का परीक्षण करें।',
        es: 'Prueba tus habilidades matemáticas con problemas aritméticos básicos.',
        fr: 'Testez vos compétences en mathématiques avec des problèmes arithmétiques de base.'
      },
      category: 'Mathematics',
      difficulty: 'easy',
      timeLimit: 5,
      availableLanguages: ['en', 'hi', 'es', 'fr'],
      defaultLanguage: 'en',
      tags: ['mathematics', 'arithmetic', 'easy'],
      createdBy: 'system',
      questions: {
        create: [
          {
            sequenceNumber: 1,
            question: {
              en: 'What is 7 × 8?',
              hi: '7 × 8 क्या है?',
              es: '¿Cuánto es 7 × 8?',
              fr: 'Combien font 7 × 8?'
            },
            options: {
              en: ['54', '56', '58', '60'],
              hi: ['54', '56', '58', '60'],
              es: ['54', '56', '58', '60'],
              fr: ['54', '56', '58', '60']
            },
            correctAnswer: 1,
            explanation: {
              en: '7 multiplied by 8 equals 56.',
              hi: '7 को 8 से गुणा करने पर 56 बराबर होता है।',
              es: '7 multiplicado por 8 es igual a 56.',
              fr: '7 multiplié par 8 est égal à 56.'
            },
            points: 10
          },
          {
            sequenceNumber: 2,
            question: {
              en: 'What is 100 ÷ 5?',
              hi: '100 ÷ 5 क्या है?',
              es: '¿Cuánto es 100 ÷ 5?',
              fr: 'Combien font 100 ÷ 5?'
            },
            options: {
              en: ['15', '20', '25', '30'],
              hi: ['15', '20', '25', '30'],
              es: ['15', '20', '25', '30'],
              fr: ['15', '20', '25', '30']
            },
            correctAnswer: 1,
            explanation: {
              en: '100 divided by 5 equals 20.',
              hi: '100 को 5 से भाग देने पर 20 बराबर होता है।',
              es: '100 dividido entre 5 es igual a 20.',
              fr: '100 divisé par 5 est égal à 20.'
            },
            points: 10
          }
        ]
      }
    }
  });

  console.log(`✅ Created ${await prisma.multilingualQuiz.count()} multilingual quizzes`);
  console.log(`📝 Created ${await prisma.multilingualQuestion.count()} multilingual questions`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
