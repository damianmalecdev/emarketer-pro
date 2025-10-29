'use client';

import { useState, useEffect } from 'react';
import { useCompany } from '@/hooks/useCompany';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChevronDown, Plus, Building2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface CompanySwitcherProps {
  className?: string;
}

export function CompanySwitcher({ className }: CompanySwitcherProps) {
  const { activeCompany, companies, setActiveCompany, refreshCompanies } = useCompany();
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleCompanySelect = (companyId: string) => {
    const company = companies.find(c => c.id === companyId);
    if (company) {
      setActiveCompany(company);
      setIsOpen(false);
    }
  };

  if (!isMounted) {
    return (
      <div className={`relative ${className}`}>
        <Button variant="outline" className="w-full justify-between text-left" disabled>
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span className="truncate">Loading...</span>
          </div>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Company Selector Button */}
      <Button
        variant="outline"
        className="w-full justify-between text-left text-foreground"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          <span className="truncate">
            {activeCompany?.name || 'Select Project'}
          </span>
        </div>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {/* Dropdown */}
      {isOpen && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 shadow-lg">
          <div className="p-2 space-y-1">
            {companies.map((company) => (
              <button
                key={company.id}
                onClick={() => handleCompanySelect(company.id)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                  activeCompany?.id === company.id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground hover:bg-muted'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  <span className="truncate">{company.name}</span>
                </div>
              </button>
            ))}
            
            {/* Create New Project Button */}
            <div className="border-t pt-2 mt-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2"
                onClick={() => {
                  setShowCreateModal(true);
                  setIsOpen(false);
                }}
              >
                <Plus className="h-4 w-4" />
                Create New Project
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Create Project Modal */}
      {showCreateModal && (
        <CreateCompanyModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            refreshCompanies();
            setShowCreateModal(false);
          }}
        />
      )}
    </div>
  );
}

// Create Company Modal Component
interface CreateCompanyModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

function CreateCompanyModal({ onClose, onSuccess }: CreateCompanyModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/companies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
        credentials: 'include',
      });

      if (response.ok) {
        onSuccess();
      } else {
        // Try to parse JSON error, but handle cases where it fails
        let errorMessage = 'Failed to create company';
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
            console.error('Failed to create company:', errorData);
          } catch (parseError) {
            // If JSON parsing fails, use the response status text
            errorMessage = `${errorMessage} (${response.status}: ${response.statusText})`;
            console.error('Failed to parse JSON error:', parseError);
          }
        } else {
          // Non-JSON response (likely HTML error page)
          try {
            const text = await response.text();
            console.error('Non-JSON error response:', text.substring(0, 200));
          } catch (textError) {
            console.error('Failed to read response text:', textError);
          }
          errorMessage = `${errorMessage} (${response.status}: ${response.statusText})`;
        }
        
        setError(errorMessage);
      }
    } catch (error) {
      setError('Network error. Please try again.');
      console.error('Error creating company:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4">Create New Project</h2>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Project Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="e.g., Butosklep.pl"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Domain (optional)
              </label>
              <input
                type="text"
                value={formData.domain}
                onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="butosklep.pl"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Description (optional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                rows={3}
                placeholder="Brief description of your project..."
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? 'Creating...' : 'Create Project'}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}
