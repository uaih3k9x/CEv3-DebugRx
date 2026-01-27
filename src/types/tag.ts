// ================================================================================
// Tag Definition Types (Admin)
// ================================================================================

export type TagDataType = 'string' | 'number' | 'enum';

export interface TagDefinition {
  id: number;
  name: string;
  display_name: string;
  data_type: TagDataType;
  enum_values?: string[];
  description?: string;
  is_system: boolean;
  created_at: string;
  updated_at?: string;
}

export interface CreateTagDefRequest {
  name: string;
  display_name: string;
  data_type?: TagDataType;
  enum_values?: string[];
  description?: string;
}

export interface UpdateTagDefRequest {
  display_name?: string;
  description?: string;
  enum_values?: string[];
}

// ================================================================================
// User Tag Types
// ================================================================================

export interface UserTag {
  tag_id: number;
  tag_name: string;
  display_name: string;
  tag_value: string;
  academic_year?: string;
}

export interface AssignTagRequest {
  tag_name: string;
  tag_value: string;
  academic_year?: string;
}

export interface UserWithTags {
  user: {
    id: number;
    sso_id: string;
    username: string;
    display_name: string;
    email?: string;
    department?: string;
    grade?: string;
    class_name?: string;
    role?: string;
  };
  tags: Record<string, string>;
}

// ================================================================================
// Tag Condition DSL Types (Phase 2)
// ================================================================================

export type TagLogic = 'AND' | 'OR' | 'NOT';

export type TagOperator =
  | '=='
  | '!='
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'in'
  | 'not_in'
  | 'exists'
  | 'not_exists'
  | '>'
  | '>='
  | '<'
  | '<=';

export interface TagCondition {
  logic?: TagLogic;
  conditions?: TagCondition[];
  tag?: string;
  operator?: TagOperator;
  value?: string | number | string[];
}

// ================================================================================
// Query Types
// ================================================================================

export interface QueryByTagsRequest {
  condition: TagCondition;
  page?: number;
  limit?: number;
}

export interface QueryByTagsResponse {
  users: UserWithTags[];
  total: number;
  page: number;
  limit: number;
}

// ================================================================================
// Store State Types
// ================================================================================

export interface TagStoreState {
  // Tag definitions
  definitions: TagDefinition[];
  selectedDefinition: TagDefinition | null;
  definitionsLoading: boolean;

  // User tags
  userTags: Record<number, Record<string, string>>; // userId -> tags
  userTagsLoading: boolean;

  // Query results
  queryResults: UserWithTags[];
  queryTotal: number;
  queryPage: number;
  queryLimit: number;
  queryLoading: boolean;

  // Error state
  error: string | null;
}
