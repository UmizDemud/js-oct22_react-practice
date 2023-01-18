import {
  FC,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from 'react';
import cn from 'classnames';
import './App.scss';

import usersFromServer from './api/users';
import productsFromServer from './api/products';
import categoriesFromServer from './api/categories';
import { Product } from './types/Product';

enum SortType {
  NONE,
  ID,
  PRODUCT,
  CATEGORY,
  USER,
}

export const App: FC = () => {
  const [selectedUser, setSelectedUser] = useState(0);
  const [query, setQuery] = useState('');
  const allCategories = useMemo(
    () => categoriesFromServer.map(cat => cat.title), [categoriesFromServer],
  );
  const [
    selectedCategories,
    setSelectedCategories,
  ] = useState<string[]>([...allCategories]);

  const [sortType, setSortType] = useState<SortType>(SortType.ID);
  const [isSortReverse, setIsSortReverse] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [visibleProducts, setVisibleProducts] = useState<Product[]>([]);

  const sortProducts = (array: Product[], sT: SortType, asc: boolean) => {
    switch (sT) {
      case SortType.CATEGORY:
        return array
          .sort((a, b) => {
            return asc
              ? (
                (a.category?.title as string).split(' - ')[0] || '')
                .localeCompare(
                  (b.category?.title as string).split(' - ')[0] || '',
                )
              : (
                (b.category?.title as string).split(' - ')[0] || '')
                .localeCompare(
                  (a.category?.title as string).split(' - ')[0] || '',
                );
          });
      case SortType.PRODUCT:
        return array
          .sort((a, b) => {
            return asc
              ? a.name.localeCompare(b.name)
              : b.name.localeCompare(a.name);
          });
      case SortType.USER:
        return array
          .sort((a, b) => {
            return asc
              ? (a.user?.name as string)
                .localeCompare(b.user?.name as string)
              : (b.user?.name as string)
                .localeCompare(a.user?.name as string);
          });
      case SortType.ID:
        return array.sort((a, b) => {
          return asc
            ? a.id - b.id
            : b.id - a.id;
        });
      default:
        return array;
    }
  };

  useEffect(() => {
    setProducts(productsFromServer.map(product => {
      const category = categoriesFromServer
        .find(cat => cat.id === product.categoryId);
      const user = usersFromServer
        .find(usr => usr.id === category?.ownerId);

      return ({
        ...product,
        category,
        user,
      });
    }));
  }, []);

  useEffect(() => {
    let filteredProducts = [...products].filter(prod => selectedCategories
      .includes(prod.category?.title || ''));

    if (selectedUser) {
      filteredProducts = filteredProducts
        .filter(prod => prod.user?.id === selectedUser);
    }

    if (query) {
      const trimmedQuery = query.toLowerCase();

      filteredProducts = filteredProducts
        .filter(prod => prod.name.toLowerCase().includes(trimmedQuery));
    }

    if (sortType) {
      filteredProducts = sortProducts(
        filteredProducts,
        sortType,
        !isSortReverse,
      );
    }

    setVisibleProducts(filteredProducts);
  }, [
    products,
    selectedUser,
    query,
    selectedCategories,
    sortType,
    isSortReverse,
  ]);

  const toggleSort = (newSortType: SortType) => {
    // first click
    if (sortType !== newSortType) {
      setSortType(newSortType);
      setIsSortReverse(false);

      return;
    }

    // second click
    if (isSortReverse) {
      setSortType(SortType.NONE);
      setIsSortReverse(false);

      return;
    }

    // third click
    setIsSortReverse(true);
  };

  const resetFilters = useCallback(
    () => {
      setQuery('');
      setSelectedUser(0);
      setSelectedCategories(allCategories);
      setSortType(SortType.NONE);
      setIsSortReverse(false);
    },
    [],
  );

  return (
    <div className="section">
      <div className="container">
        <h1 className="title">Product Categories</h1>

        <div className="block">
          <nav className="panel">
            <p className="panel-heading">Filters</p>

            <p className="panel-tabs has-text-weight-bold">
              <a
                data-cy="FilterAllUsers"
                href="#/all"
                className={cn(
                  { 'is-active': selectedUser === 0 },
                )}
                onClick={() => setSelectedUser(0)}
              >
                All
              </a>

              {usersFromServer.map(user => (
                <a
                  key={user.id}
                  data-cy="FilterUser"
                  href={`#/${user.name}`}
                  className={cn(
                    { 'is-active': selectedUser === user.id },
                  )}
                  onClick={() => setSelectedUser(user.id)}
                >
                  {user.name}
                </a>
              ))}
            </p>

            <div className="panel-block">
              <p className="control has-icons-left has-icons-right">
                <input
                  data-cy="SearchField"
                  type="text"
                  className="input"
                  placeholder="Search"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                />

                <span className="icon is-left">
                  <i className="fas fa-search" aria-hidden="true" />
                </span>

                <span className="icon is-right">
                  {query && (
                    <button
                      data-cy="ClearButton"
                      type="button"
                      className="delete"
                      aria-label="clear search"
                      onClick={() => setQuery('')}
                    />
                  )}
                </span>
              </p>
            </div>

            <div className="panel-block is-flex-wrap-wrap">
              <a
                href="#/"
                data-cy="AllCategories"
                className={cn(
                  'button is-success mr-6',
                  {
                    'is-outlined':
                    selectedCategories.length !== allCategories.length,
                  },
                )}
                onClick={() => setSelectedCategories([...allCategories])}
              >
                All
              </a>

              {categoriesFromServer.map(category => (
                <a
                  key={category.id}
                  data-cy="Category"
                  className={cn(
                    'button mr-2 my-1',
                    {
                      'is-info': selectedCategories.includes(category.title),
                    },
                  )}
                  href="#/"
                  onClick={() => {
                    if (selectedCategories.includes(category.title)) {
                      setSelectedCategories(
                        prev => prev.filter(title => title !== category.title),
                      );
                    } else {
                      setSelectedCategories(prev => [...prev, category.title]);
                    }
                  }}
                >
                  {category.title}
                </a>
              ))}
            </div>

            <div className="panel-block">
              <a
                data-cy="ResetAllButton"
                href="#/"
                className="button is-link is-outlined is-fullwidth"
                onClick={() => resetFilters()}
              >
                Reset all filters
              </a>
            </div>
          </nav>
        </div>

        <div className="box table-container">
          {visibleProducts.length
            ? (
              <table
                data-cy="ProductTable"
                className="table is-striped is-narrow is-fullwidth"
              >
                <thead>
                  <tr>
                    <th
                      style={{ cursor: 'pointer' }}
                      onClick={() => toggleSort(SortType.ID)}
                    >
                      <span className="is-flex is-flex-wrap-nowrap">
                        ID

                        <a href="#/">
                          <span className="icon">
                            <i
                              data-cy="SortIcon"
                              className={cn(
                                'fas',
                                { 'fa-sort': sortType !== SortType.ID },
                                {
                                  'fa-sort-up': sortType === SortType.ID
                                    && !isSortReverse,
                                },
                                {
                                  'fa-sort-down': sortType === SortType.ID
                                    && isSortReverse,
                                },
                              )}
                            />
                          </span>
                        </a>
                      </span>
                    </th>

                    <th
                      style={{ cursor: 'pointer' }}
                      onClick={() => toggleSort(SortType.PRODUCT)}
                    >
                      <span className="is-flex is-flex-wrap-nowrap">
                        Product

                        <a href="#/">
                          <span className="icon">
                            <i
                              data-cy="SortIcon"
                              className={cn(
                                'fas',
                                { 'fa-sort': sortType !== SortType.PRODUCT },
                                {
                                  'fa-sort-up': sortType === SortType.PRODUCT
                                    && !isSortReverse,
                                },
                                {
                                  'fa-sort-down': sortType === SortType.PRODUCT
                                    && isSortReverse,
                                },
                              )}
                            />
                          </span>
                        </a>
                      </span>
                    </th>

                    <th
                      style={{ cursor: 'pointer' }}
                      onClick={() => toggleSort(SortType.CATEGORY)}
                    >
                      <span className="is-flex is-flex-wrap-nowrap">
                        Category

                        <a href="#/">
                          <span className="icon">
                            <i
                              data-cy="SortIcon"
                              className={cn(
                                'fas',
                                { 'fa-sort': sortType !== SortType.CATEGORY },
                                {
                                  'fa-sort-up': sortType === SortType.CATEGORY
                                    && !isSortReverse,
                                },
                                {
                                  'fa-sort-down': sortType === SortType.CATEGORY
                                    && isSortReverse,
                                },
                              )}
                            />
                          </span>
                        </a>
                      </span>
                    </th>

                    <th
                      style={{ cursor: 'pointer' }}
                      onClick={() => toggleSort(SortType.USER)}
                    >
                      <span className="is-flex is-flex-wrap-nowrap">
                        User

                        <a href="#/">
                          <span className="icon">
                            <i
                              data-cy="SortIcon"
                              className={cn(
                                'fas',
                                { 'fa-sort': sortType !== SortType.USER },
                                {
                                  'fa-sort-up': sortType === SortType.USER
                                    && !isSortReverse,
                                },
                                {
                                  'fa-sort-down': sortType === SortType.USER
                                    && isSortReverse,
                                },
                              )}
                            />
                          </span>
                        </a>
                      </span>
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {visibleProducts.map(product => (
                    <tr key={product.id} data-cy="Product">
                      <td className="has-text-weight-bold" data-cy="ProductId">
                        {product.id}
                      </td>

                      <td data-cy="ProductName">{product.name}</td>
                      <td data-cy="ProductCategory">
                        {`${product.category?.icon} - ${product.category?.title}`}
                      </td>

                      <td
                        data-cy="ProductUser"
                        className={cn(
                          { 'has-text-danger': product.user?.sex === 'f' },
                          { 'has-text-link': product.user?.sex === 'm' },
                        )}
                      >
                        {product.user?.name}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
            : (
              <p data-cy="NoMatchingMessage">
                No products matching selected criteria
              </p>
            )}
        </div>
      </div>
    </div>
  );
};
