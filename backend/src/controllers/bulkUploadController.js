const pdf = require('pdf-parse');

/**
 * Robust MCQ Parser + Correct Answer Fix
 */
const parseMcqs = (text) => {
  const questions = [];

  // 🔹 STEP 1: CLEAN TEXT
  let cleanText = text;

  cleanText = cleanText.replace(/\r/g, '');
  cleanText = cleanText.replace(/\n{2,}/g, '\n');

  // Fix merged options
  cleanText = cleanText.replace(/([A-D])\./g, '\n$1) ');
  cleanText = cleanText.replace(/(\d)([A-D]\))/g, '$1\n$2');

  // 🔹 STEP 2: SPLIT QUESTIONS
  const questionBlocks = cleanText.split(/(?:\n|^)\s*(?:\d+[\.\)]|\d+\s|Q\d+[\.\)])\s*/i);

  for (let block of questionBlocks) {
    block = block.trim();
    if (!block || block.length < 10) continue;

    // 🔹 STEP 3: FIND OPTIONS START
    const optionStart = block.search(/[\(\[]?A[\)\]\.]/i);
    if (optionStart === -1) continue;

    const questionText = block.substring(0, optionStart).trim();
    const rest = block.substring(optionStart).trim();

    // 🔹 STEP 4: EXTRACT OPTIONS
    const options = [];
    const labels = ['A', 'B', 'C', 'D'];

    for (let i = 0; i < labels.length; i++) {
      const current = labels[i];
      const next = labels[i + 1];

      const currentRegex = new RegExp(`[\\(\\[]?${current}[\\)\\]\\.]\\s*`, 'i');
      const nextRegex = next
        ? new RegExp(`[\\(\\[]?${next}[\\)\\]\\.]\\s*`, 'i')
        : /(?:Answer|Ans)\s*[:\-]?\s*/i;

      const startMatch = rest.match(currentRegex);
      if (!startMatch) continue;

      const startIdx = startMatch.index + startMatch[0].length;

      let endIdx = rest.length;
      const nextMatch = rest.substring(startIdx).match(nextRegex);
      if (nextMatch) {
        endIdx = startIdx + nextMatch.index;
      }

      let optionText = rest.substring(startIdx, endIdx)
        .replace(/\n/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (optionText && optionText.length > 1) {
        options.push({
          id: current, // ✅ KEEP UPPERCASE
          text: optionText
        });
      }
    }

    // 🔹 STEP 5: EXTRACT CORRECT ANSWER
    let correctAnswer = '';

    const answerMatch = rest.match(/(?:answer|ans)\s*[:\-]?\s*([A-D])/i);
    if (answerMatch) {
      correctAnswer = answerMatch[1].toUpperCase(); // ✅ FORCE UPPERCASE
    }

    // 🔹 FALLBACK (if answer not found)
    if (!correctAnswer) {
      const fallback = block.match(/([A-D])\s*$/);
      if (fallback) {
        correctAnswer = fallback[1].toUpperCase();
      }
    }

    // 🔹 STEP 6: CLEAN QUESTION
    const cleanedQuestion = questionText
      .replace(/(?:medium|easy|hard)\s+\d+\s+PTS/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    const title = cleanedQuestion.split(/[?\.!:]/)[0].substring(0, 120);

    // 🔹 FINAL VALIDATION
    if (options.length === 4 && correctAnswer) {
      questions.push({
        title: title || 'Untitled Question',
        description: cleanedQuestion,
        question_type: 'mcq',
        options,
        correct_answer: correctAnswer, // ✅ always A/B/C/D
        difficulty: 'medium',
        category: 'technical_mcq'
      });
    }
  }

  return questions;
};

exports.parsePdfMcqs = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    const data = await pdf(req.file.buffer);
    const questions = parseMcqs(data.text);

    res.json({
      questions,
      count: questions.length,
      raw_preview: data.text.substring(0, 500)
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to parse PDF' });
  }
};