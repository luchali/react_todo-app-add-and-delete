/* eslint-disable max-len */
/* eslint-disable jsx-a11y/control-has-associated-label */
import React, { useEffect, useRef, useState } from 'react';
import { UserWarning } from './UserWarning';
import { Todo } from './types/Todo';
import { ErrorMessages } from './types/ErrorMessages';
import { getTodos, deleteTodo as apiDeleteTodo, createTodo } from './api/todos';
import { Header } from './components/Header';
import { ErrorNotification } from './components/ErrorNotification';
import { TodoList } from './components/TodoList';
import { FilterType } from './types/FilterType';
import { TodoItem } from './components/TodoItem';
import { Footer } from './components/Footer';

const USER_ID = 2576;

export const App: React.FC = () => {
  const [todoList, setTodoList] = useState<Todo[]>([]);
  const [errorMessage, setErrorMessage] = useState<ErrorMessages>(
    ErrorMessages.default,
  );
  const [currentFilter, setCurrentFilter] = useState(FilterType.all);
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [tempTodo, setTempTodo] = useState<Todo | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsLoading(true);
    setCurrentFilter(FilterType.all);
    setErrorMessage(ErrorMessages.default);

    getTodos()
      .then(setTodoList)
      .catch(() => {
        setErrorMessage(ErrorMessages.getError);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    inputRef.current?.focus();
  }, [isLoading]);

  function deleteTodo(todoId: number) {
    setIsLoading(true);
    apiDeleteTodo(todoId)
      .then(() => {
        setTodoList(currentTodos =>
          currentTodos.filter(todo => todo.id !== todoId),
        );
      })
      .catch(() => {
        setErrorMessage(ErrorMessages.deleteError);
      })
      .finally(() => setIsLoading(false));
  }

  function clearCompletedTodos() {
    const completedTodos = todoList.filter(todo => todo.completed);

    if (completedTodos.length === 0) {
      setErrorMessage(ErrorMessages.deleteError || 'No completed todos');

      return;
    }

    setIsLoading(true);

    Promise.all(completedTodos.map(todo => apiDeleteTodo(todo.id)))
      .then(() => {
        setTodoList(currentTodos =>
          currentTodos.filter(todo => !todo.completed),
        );
      })
      .catch(() => {
        setErrorMessage(ErrorMessages.deleteError || 'Unable to delete todos');
      })
      .finally(() => {
        setIsLoading(false);
        inputRef.current?.focus();
      });
  }

  function addTodo(todoTitle: string) {
    const trimmedTitle = todoTitle.trim();

    if (!trimmedTitle) {
      setErrorMessage(ErrorMessages.emptyTitleError);

      return;
    }

    setIsLoading(true);
    // тимчасовий todo
    const newTempTodo: Todo = {
      id: 0,
      userId: USER_ID,
      title: trimmedTitle,
      completed: false,
    };

    setTempTodo(newTempTodo);

    createTodo({ title: trimmedTitle, userId: USER_ID, completed: false })
      .then(newTodo => {
        setTodoList(currentTodoList => [...currentTodoList, newTodo]);
        setTitle('');
        setErrorMessage(ErrorMessages.default);
      })
      .catch(() => {
        setErrorMessage(ErrorMessages.addError || 'Unable to add a todo');
      })
      .finally(() => {
        setTempTodo(null);
        setIsLoading(false);
        inputRef.current?.focus();
      });
  }

  if (!USER_ID) {
    return <UserWarning />;
  }

  return (
    <div className="todoapp">
      <h1 className="todoapp__title">todos</h1>

      <div className="todoapp__content">
        <Header
          title={title}
          onChange={setTitle}
          onAdd={addTodo}
          inputRef={inputRef}
          disabled={isLoading}
        />

        <TodoList
          isLoading={isLoading}
          todoList={todoList}
          currentFilter={currentFilter}
          deleteTodo={deleteTodo}
        />

        {tempTodo && currentFilter !== FilterType.completed && (
          <TodoItem todo={tempTodo} deleteTodo={() => {}} isTemp={true} />
        )}

        {todoList.length > 0 && (
          <Footer
            todoList={todoList}
            clearCompletedTodos={clearCompletedTodos}
            currentFilter={currentFilter}
            setCurrentFilter={setCurrentFilter}
          />
        )}
      </div>
      <ErrorNotification
        key={errorMessage}
        errorMessage={errorMessage}
        removeError={() => {
          setErrorMessage(ErrorMessages.default);
        }}
      />
    </div>
  );
};
