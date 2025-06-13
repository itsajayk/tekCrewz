import React from 'react';
import styled from 'styled-components';

// A simple editor for title + list of questions/options with correctIndex input and validation
export default function QuizEditor({ quiz = { title:'', questions:[] }, onChange, onSave }) {
  const upd = (path, val) => {
    const nw = JSON.parse(JSON.stringify(quiz));
    path.split('.').reduce((o,k,i,arr)=>{
      if (i===arr.length-1) o[k]=val;
      return o[k];
    }, nw);
    onChange(nw);
  };

  const addQuestion = () => {
    onChange({
      ...quiz,
      questions: [
        ...quiz.questions,
        { question:'', options:['','','',''], correctIndex:0 }
      ]
    });
  };

  const removeQuestion = (i) => {
    const newQs = quiz.questions.filter((_, idx) => idx !== i);
    onChange({ ...quiz, questions: newQs });
  };

  const updateOptionCount = (qIndex, newCount) => {
    if (newCount < 2) return;
    const question = quiz.questions[qIndex];
    const opts = question.options.slice();
    if (newCount > opts.length) {
      while (opts.length < newCount) opts.push('');
    } else if (newCount < opts.length) {
      opts.splice(newCount);
      // Adjust correctIndex if out of bounds
      if (question.correctIndex >= newCount) {
        upd(`questions.${qIndex}.correctIndex`, 0);
      }
    }
    upd(`questions.${qIndex}.options`, opts);
  };

  // Validate before save: ensure title and each question and options are non-empty, correctIndex valid
  const validate = () => {
    if (!quiz.title.trim()) return 'Title cannot be empty';
    for (let i = 0; i < quiz.questions.length; i++) {
      const q = quiz.questions[i];
      if (!q.question.trim()) return `Question ${i+1} cannot be empty`;
      if (!Array.isArray(q.options) || q.options.length < 2) return `Question ${i+1} needs at least 2 options`;
      for (let j = 0; j < q.options.length; j++) {
        if (!q.options[j].trim()) return `Option ${j+1} in Question ${i+1} cannot be empty`;
      }
      if (q.correctIndex == null || q.correctIndex < 0 || q.correctIndex >= q.options.length) {
        return `Correct answer index for Question ${i+1} is invalid`;
      }
    }
    return null;
  };

  const handleSave = () => {
    const err = validate();
    if (err) {
      alert(err);
      return;
    }
    onSave();
  };

  return (
    <EditorContainer>
      <Label>Title</Label>
      <Input value={quiz.title} onChange={e=>upd('title', e.target.value)} placeholder="Quiz Title" />

      {quiz.questions.map((q,i) => (
        <QuestionBlock key={i}>
          <HeaderRow>
            <Label>Q{i+1}</Label>
            <RemoveButton type="button" onClick={() => removeQuestion(i)}>Remove</RemoveButton>
          </HeaderRow>
          <Input
            placeholder="Question text"
            value={q.question}
            onChange={e=>upd(`questions.${i}.question`, e.target.value)}
          />
          <Label>Options</Label>
          {q.options.map((opt,j)=>(
            <OptionRow key={j}>
              <input
                type="radio"
                name={`correct-${i}`}
                checked={q.correctIndex===j}
                onChange={()=>upd(`questions.${i}.correctIndex`, j)}
              />
              <Input
                placeholder={`Option ${j+1}`}
                value={opt}
                onChange={e=>upd(`questions.${i}.options.${j}`, e.target.value)}
              />
            </OptionRow>
          ))}
          {/* Numeric input for correctIndex as alternative */}
          <Label>Correct Answer Index</Label>
          <Input
            type="number"
            min={0}
            max={q.options.length - 1}
            value={q.correctIndex}
            onChange={e=>{
              let idx = parseInt(e.target.value, 10);
              if (isNaN(idx)) return;
              if (idx >= 0 && idx < q.options.length) {
                upd(`questions.${i}.correctIndex`, idx);
              }
            }}
          />
          <Label>Number of Options</Label>
          <Input
            type="number"
            min={2}
            value={q.options.length}
            onChange={e=>{
              let cnt = parseInt(e.target.value, 10);
              if (isNaN(cnt) || cnt < 2) return;
              updateOptionCount(i, cnt);
            }}
          />
        </QuestionBlock>
      ))}
      <Button type="button" onClick={addQuestion}>Add Question</Button>
      <Button type="button" onClick={handleSave}>Save Quiz</Button>
    </EditorContainer>
  );
}

// Styled components definitions
const EditorContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 16px;
  background: #f9f9f9;
  border-radius: 8px;
`;
const Label = styled.label`
  font-weight: bold;
  margin: 8px 0 4px;
`;
const Input = styled.input`
  padding: 8px;
  margin-bottom: 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
`;
const QuestionBlock = styled.div`
  margin-bottom: 16px;
  padding: 12px;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
`;
const OptionRow = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 8px;
`;
const HeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;
const RemoveButton = styled.button`
  background: transparent;
  border: none;
  color: #c00;
  cursor: pointer;
  font-size: 14px;
`;
const Button = styled.button`
  padding: 10px 16px;
  margin-top: 12px;
  border: none;
  border-radius: 4px;
  background: #007bff;
  color: #fff;
  cursor: pointer;
  &:hover {
    background: #0056b3;
  }
`;
