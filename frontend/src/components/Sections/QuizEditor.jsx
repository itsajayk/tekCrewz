import React from 'react';
import styled from 'styled-components';

// A simple editor for title + list of questions/options
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

  return (
    <EditorContainer>
      <Label>Title</Label>
      <Input value={quiz.title} onChange={e=>upd('title', e.target.value)}/>
      {quiz.questions.map((q,i) => (
        <QuestionBlock key={i}>
          <Label>Q{i+1}</Label>
          <Input
            placeholder="Question text"
            value={q.question}
            onChange={e=>upd(`questions.${i}.question`, e.target.value)}
          />
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
        </QuestionBlock>
      ))}
      <Button onClick={addQuestion}>Add Question</Button>
      <Button onClick={onSave}>Save Quiz</Button>
    </EditorContainer>
  );
}

// Styled components definitions
const EditorContainer = styled.div`  // NEW
  display: flex;
  flex-direction: column;
  padding: 16px;
  background: #f9f9f9;
  border-radius: 8px;
`;
const Label = styled.label`  // NEW
  font-weight: bold;
  margin: 8px 0 4px;
`;
const Input = styled.input`  // NEW
  padding: 8px;
  margin-bottom: 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
`;
const QuestionBlock = styled.div`  // NEW
  margin-bottom: 16px;
  padding: 12px;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
`;
const OptionRow = styled.div`  // NEW
  display: flex;
  align-items: center;
  margin-bottom: 8px;
`;
const Button = styled.button`  // NEW
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