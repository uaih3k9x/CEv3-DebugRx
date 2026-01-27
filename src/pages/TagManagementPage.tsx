import { useEffect, useState } from 'react';
import { Tag, Plus, Pencil, Trash2, Lock, AlertCircle, X } from 'lucide-react';
import { useTagStore, selectSystemTags, selectCustomTags } from '../stores/tagStore';
import type { TagDefinition, CreateTagDefRequest, UpdateTagDefRequest } from '../types/tag';

// ================================================================================
// Tag Definition Form Modal
// ================================================================================

interface TagFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingTag?: TagDefinition | null;
  onSubmit: (data: CreateTagDefRequest | UpdateTagDefRequest) => Promise<void>;
}

function TagFormModal({ isOpen, onClose, editingTag, onSubmit }: TagFormModalProps) {
  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [dataType, setDataType] = useState<'string' | 'number' | 'enum'>('string');
  const [enumValues, setEnumValues] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingTag) {
      setName(editingTag.name);
      setDisplayName(editingTag.display_name);
      setDataType(editingTag.data_type || 'string');
      setEnumValues(editingTag.enum_values?.join(', ') || '');
      setDescription(editingTag.description || '');
    } else {
      setName('');
      setDisplayName('');
      setDataType('string');
      setEnumValues('');
      setDescription('');
    }
    setError(null);
  }, [editingTag, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const data: CreateTagDefRequest | UpdateTagDefRequest = editingTag
        ? {
            display_name: displayName,
            description: description || undefined,
            enum_values: dataType === 'enum' ? enumValues.split(',').map((v) => v.trim()).filter(Boolean) : undefined,
          }
        : {
            name,
            display_name: displayName,
            data_type: dataType,
            enum_values: dataType === 'enum' ? enumValues.split(',').map((v) => v.trim()).filter(Boolean) : undefined,
            description: description || undefined,
          };

      await onSubmit(data);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="text-lg font-semibold">
            {editingTag ? 'Edit Tag Definition' : 'Create Tag Definition'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name (identifier)
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!!editingTag}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              placeholder="e.g., department"
              required={!editingTag}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Department"
              required
            />
          </div>

          {!editingTag && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Type
              </label>
              <select
                value={dataType}
                onChange={(e) => setDataType(e.target.value as 'string' | 'number' | 'enum')}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="string">String</option>
                <option value="number">Number</option>
                <option value="enum">Enum</option>
              </select>
            </div>
          )}

          {dataType === 'enum' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Enum Values (comma separated)
              </label>
              <input
                type="text"
                value={enumValues}
                onChange={(e) => setEnumValues(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., CS, SE, EE"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="Optional description..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Saving...' : editingTag ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ================================================================================
// Tag Definition Card
// ================================================================================

interface TagCardProps {
  tag: TagDefinition;
  onEdit: (tag: TagDefinition) => void;
  onDelete: (tag: TagDefinition) => void;
}

function TagCard({ tag, onEdit, onDelete }: TagCardProps) {
  return (
    <div className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Tag className="w-5 h-5 text-blue-600" />
          <div>
            <h4 className="font-medium text-gray-900">{tag.display_name}</h4>
            <p className="text-sm text-gray-500">{tag.name}</p>
          </div>
        </div>
        {tag.is_system ? (
          <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
            <Lock className="w-3 h-3" />
            System
          </span>
        ) : (
          <div className="flex items-center gap-1">
            <button
              onClick={() => onEdit(tag)}
              className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(tag)}
              className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
          {tag.data_type || 'string'}
        </span>
        {tag.enum_values && tag.enum_values.length > 0 && (
          <span className="text-xs bg-purple-50 text-purple-600 px-2 py-1 rounded">
            {tag.enum_values.length} values
          </span>
        )}
      </div>

      {tag.description && (
        <p className="mt-2 text-sm text-gray-600 line-clamp-2">{tag.description}</p>
      )}
    </div>
  );
}

// ================================================================================
// Main Page Component
// ================================================================================

export default function TagManagementPage() {
  const {
    definitionsLoading,
    error,
    loadDefinitions,
    createDefinition,
    updateDefinition,
    deleteDefinition,
    clearError,
  } = useTagStore();

  const systemTags = useTagStore(selectSystemTags);
  const customTags = useTagStore(selectCustomTags);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<TagDefinition | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<TagDefinition | null>(null);

  useEffect(() => {
    loadDefinitions();
  }, [loadDefinitions]);

  const handleCreate = () => {
    setEditingTag(null);
    setIsModalOpen(true);
  };

  const handleEdit = (tag: TagDefinition) => {
    setEditingTag(tag);
    setIsModalOpen(true);
  };

  const handleDelete = (tag: TagDefinition) => {
    setDeleteConfirm(tag);
  };

  const confirmDelete = async () => {
    if (deleteConfirm) {
      try {
        await deleteDefinition(deleteConfirm.id);
        setDeleteConfirm(null);
      } catch {
        // Error handled by store
      }
    }
  };

  const handleSubmit = async (data: CreateTagDefRequest | UpdateTagDefRequest) => {
    if (editingTag) {
      await updateDefinition(editingTag.id, data as UpdateTagDefRequest);
    } else {
      await createDefinition(data as CreateTagDefRequest);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tag Management</h1>
            <p className="text-gray-600 mt-1">
              Manage tag definitions for user classification
            </p>
          </div>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" />
            Create Tag
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
            <button onClick={clearError} className="text-red-400 hover:text-red-600">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Loading State */}
        {definitionsLoading && (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading tag definitions...</p>
          </div>
        )}

        {/* Content */}
        {!definitionsLoading && (
          <div className="space-y-8">
            {/* System Tags */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Lock className="w-5 h-5 text-amber-600" />
                System Tags
                <span className="text-sm font-normal text-gray-500">
                  ({systemTags.length})
                </span>
              </h2>
              {systemTags.length === 0 ? (
                <p className="text-gray-500 text-sm">No system tags defined.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {systemTags.map((tag) => (
                    <TagCard
                      key={tag.id}
                      tag={tag}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Custom Tags */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Tag className="w-5 h-5 text-blue-600" />
                Custom Tags
                <span className="text-sm font-normal text-gray-500">
                  ({customTags.length})
                </span>
              </h2>
              {customTags.length === 0 ? (
                <div className="text-center py-8 bg-white rounded-lg border border-dashed">
                  <Tag className="w-12 h-12 text-gray-300 mx-auto" />
                  <p className="mt-2 text-gray-500">No custom tags yet.</p>
                  <button
                    onClick={handleCreate}
                    className="mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    Create your first tag
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {customTags.map((tag) => (
                    <TagCard
                      key={tag.id}
                      tag={tag}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {/* Create/Edit Modal */}
        <TagFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          editingTag={editingTag}
          onSubmit={handleSubmit}
        />

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-sm mx-4 p-6">
              <h3 className="text-lg font-semibold text-gray-900">Delete Tag</h3>
              <p className="mt-2 text-gray-600">
                Are you sure you want to delete "{deleteConfirm.display_name}"? This will also
                remove all user tag assignments.
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
