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

// … styled-components for EditorContainer, Input, Label, Button, QuestionBlock, OptionRow …
