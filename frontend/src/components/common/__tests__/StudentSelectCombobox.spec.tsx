import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StudentSelectCombobox } from '../StudentSelectCombobox';
import type { Student } from '../../../types/student.types';

describe('StudentSelectCombobox Component', () => {
  const mockStudents: Student[] = [
    {
      id: 1,
      student_number: '2026-00001',
      first_name: 'Juan',
      last_name: 'Dela Cruz',
      email: 'juan@sims.edu',
      program_id: 1,
      year_level: 4,
      student_type: 'REGULAR',
      max_allowed_units: 24,
      status: 'ACTIVE',
      birth_date: '2003-01-01',
      program: { id: 1, code: 'BSIT', name: 'BS Information Technology' },
    },
    {
      id: 2,
      student_number: '2026-00002',
      first_name: 'Maria',
      last_name: 'Santos',
      email: 'maria@sims.edu',
      program_id: 2,
      year_level: 2,
      student_type: 'IRREGULAR',
      max_allowed_units: 18,
      status: 'ACTIVE',
      birth_date: '2004-02-02',
      program: { id: 2, code: 'BSCS', name: 'BS Computer Science' },
    },
    {
      id: 3,
      student_number: '2026-00003',
      first_name: 'Mateo',
      last_name: 'Guerrero',
      email: 'mateo@sims.edu',
      program_id: 1,
      year_level: 1,
      student_type: 'REGULAR',
      max_allowed_units: 24,
      status: 'ACTIVE',
      birth_date: '2005-03-03',
      program: { id: 1, code: 'BSIT', name: 'BS Information Technology' },
    },
  ];

  it('renders trigger with selected student information', () => {
    render(
      <StudentSelectCombobox
        students={mockStudents}
        selectedId={1}
        onSelect={vi.fn()}
      />
    );

    expect(screen.getByRole('combobox')).toHaveTextContent('2026-00001');
    expect(screen.getByRole('combobox')).toHaveTextContent('Dela Cruz, Juan');
    expect(screen.getByRole('combobox')).toHaveTextContent('REG');
  });

  it('opens search popover and displays live matching cases preview', () => {
    render(
      <StudentSelectCombobox
        students={mockStudents}
        selectedId={1}
        onSelect={vi.fn()}
      />
    );

    const trigger = screen.getByRole('combobox');
    fireEvent.click(trigger);

    expect(screen.getByPlaceholderText(/Search by ID, name, or program.../i)).toBeInTheDocument();
    expect(screen.getByText(/All students:/i)).toHaveTextContent('3 total');

    // Type "maria" into search box
    const searchInput = screen.getByPlaceholderText(/Search by ID, name, or program.../i);
    fireEvent.change(searchInput, { target: { value: 'maria' } });

    // Live preview count updates
    expect(screen.getByText(/Matching cases:/i)).toHaveTextContent('1 of 3');
    expect(screen.getByText('Santos,')).toBeInTheDocument();
    expect(screen.queryByText('Dela Cruz,')).not.toBeInTheDocument();
  });

  it('selects student when item is clicked', () => {
    const handleSelect = vi.fn();
    render(
      <StudentSelectCombobox
        students={mockStudents}
        selectedId={1}
        onSelect={handleSelect}
      />
    );

    fireEvent.click(screen.getByRole('combobox'));
    const searchInput = screen.getByPlaceholderText(/Search by ID, name, or program.../i);
    fireEvent.change(searchInput, { target: { value: 'Guerrero' } });

    fireEvent.click(screen.getByText('Guerrero'));
    expect(handleSelect).toHaveBeenCalledWith(3);
  });

  it('shows empty state when no students match search query', () => {
    render(
      <StudentSelectCombobox
        students={mockStudents}
        selectedId={1}
        onSelect={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('combobox'));
    const searchInput = screen.getByPlaceholderText(/Search by ID, name, or program.../i);
    fireEvent.change(searchInput, { target: { value: 'nonexistent student xyz' } });

    expect(screen.getByText(/No matching students found/i)).toBeInTheDocument();
    expect(screen.getByText(/No records match "nonexistent student xyz"/i)).toBeInTheDocument();
  });

  it('handles keyboard navigation (ArrowDown and Enter to select)', () => {
    const handleSelect = vi.fn();
    render(
      <StudentSelectCombobox
        students={mockStudents}
        selectedId={1}
        onSelect={handleSelect}
      />
    );

    // Open via Enter key
    const trigger = screen.getByRole('combobox');
    fireEvent.keyDown(trigger, { key: 'Enter' });

    // Navigate to second item and select
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    fireEvent.keyDown(trigger, { key: 'Enter' });

    expect(handleSelect).toHaveBeenCalledWith(2);
  });
});
