import { Category } from './Category';
import { User } from './User';

export type Product = {
  id: number;
  name: string;
  categoryId: number;
  category?: Category;
  user?: User;
};
