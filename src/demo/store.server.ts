/** In-memory demo data. Shared by all visitors, capped so it cannot grow without bound. */
export interface Todo {
	id: number;
	text: string;
}

export interface Post {
	id: number;
	title: string;
	content: string;
}

const MAX_ITEMS = 50;

let todos: Todo[] = [
	{ id: 1, text: 'Read the WebMCP draft' },
	{ id: 2, text: 'Try the devtools panel' }
];
let posts: Post[] = [];
let nextId = 3;

function capped<T>(items: T[]): T[] {
	return items.slice(-MAX_ITEMS);
}

export function listTodos(): Todo[] {
	return todos;
}

export function addTodo(text: string): Todo {
	const todo = { id: nextId++, text };
	todos = capped([...todos, todo]);
	return todo;
}

export function searchTodos(query: string, limit: number): Todo[] {
	const needle = query.toLowerCase();
	return todos.filter((todo) => todo.text.toLowerCase().includes(needle)).slice(0, limit);
}

export function addPost(title: string, content: string): Post {
	const post = { id: nextId++, title, content };
	posts = capped([...posts, post]);
	return post;
}

export function listPosts(): Post[] {
	return posts;
}
