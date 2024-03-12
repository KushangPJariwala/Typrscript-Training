import React, { FormEvent, useRef } from "react";

type Props = {
  addTodo: (todo: string) => void;
};

export default function NewTodo({ addTodo }: Props) {
  const textInputRef = useRef<HTMLInputElement>(null);
  const todoSubmitHandler = (e: React.FormEvent) => {
    e.preventDefault();
    const text = textInputRef.current!.value;

    addTodo(text);
  };
  return (
    <form onSubmit={todoSubmitHandler}>
      <div>
        <label htmlFor="todo-text">Todo Text</label>
        <input type="text" id="todo-text" ref={textInputRef} />{" "}
      </div>
      <button type="submit">ADD TODO</button>
    </form>
  );
}
