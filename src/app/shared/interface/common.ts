export interface CardToggleOptions {
    id: number;
    title: string;
}

export interface TableConfigs {
    columns: TableColumn[];
    /** Action icons rendered before data columns (e.g. Edit). */
    row_action_before?: TableRows[];
    row_action?: TableRows[];
    data: any[]
}

export interface TableColumn {
    title: string;
    field_value: string;
    sortable_key?: string;
    sort?: boolean;
    type?: string;
    template?: string;
    class?: string;
    decimal_number?: boolean;
    text?: string;
    icon_field?: string;
    hide_column?: boolean;
    /** When true (e.g. type `link_icon`), cell content is hidden until the row is hovered or focused within. */
    showOnHover?: boolean;
}

export interface TableRows {
  label: string;
  action_to_perform?: string;
  icon?: string;
  path?: string;
  modal?: boolean;
  model_text?: string;
  type?: string;
  class?: string;
  /** When true, the control is hidden until the table row is hovered (or focused within). */
  showOnHover?: boolean;
}

export interface TableClickedAction {
    action_to_perform?: string;
    data?: any;
    value?: any;
}

export interface columnColors {
   [key: string]: string;
}
export interface Pagination {
  total_items: number;
  current_page: number;
  page_size: number;
  total_pages: number;
  start_page: number;
  end_page?: number;
  start_index: number;
  end_index: number;
  pages: number[];
}

export interface Tabs {
  id: number;
  title: string;
  value: string;
  icon?: string;
}

export interface PageSizeOptions {
  title: number;
  value: number;
  selected?: boolean;
}

export interface ApiResponse<T> {
  data: T;
  user?: any;
  errors: {
    errorCode: string,
    message: string
  };
}

export interface IdName {
  id: number;
  name: string;
}

export interface IconsRadio {
  text: string;
  icon: string;
  check: boolean;
  id: string | number;
}
