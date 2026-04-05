/**
 * DataTable Component - Premium Design
 * Reusable table with search, animations, and polished empty state
 */
import { useState } from 'react';
import { HiOutlineSearch, HiOutlineInbox } from 'react-icons/hi';

const DataTable = ({ columns, data, searchKey, emptyMessage = 'No data found' }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = searchKey && searchTerm
    ? data.filter(item => {
        const val = item[searchKey];
        return val && val.toString().toLowerCase().includes(searchTerm.toLowerCase());
      })
    : data;

  return (
    <div>
      {/* Search Bar */}
      {searchKey && (
        <div className="relative mb-5">
          <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 text-lg" />
          <input
            type="text"
            placeholder={`Search by ${searchKey.replace(/_/g, ' ')}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-11 py-3"
            id="table-search"
          />
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl" style={{ border: '1px solid rgba(99, 102, 241, 0.08)' }}>
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col, idx) => (
                <th key={idx}>{col.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-16">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                      style={{ background: 'rgba(99, 102, 241, 0.06)', border: '1px solid rgba(99, 102, 241, 0.1)' }}>
                      <HiOutlineInbox className="text-3xl text-slate-600" />
                    </div>
                    <p className="text-sm text-slate-500 font-medium">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((item, rowIdx) => (
                <tr key={item._id || rowIdx} className="animate-fade-in" style={{ animationDelay: `${rowIdx * 30}ms` }}>
                  {columns.map((col, colIdx) => (
                    <td key={colIdx}>
                      {col.render ? col.render(item) : item[col.accessor]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Item count */}
      <div className="mt-4 flex items-center justify-between text-xs text-slate-600">
        <span>{filtered.length} of {data.length} records</span>
        {searchTerm && (
          <button onClick={() => setSearchTerm('')} className="text-indigo-500 hover:text-indigo-400 font-medium transition-colors">
            Clear search
          </button>
        )}
      </div>
    </div>
  );
};

export default DataTable;
