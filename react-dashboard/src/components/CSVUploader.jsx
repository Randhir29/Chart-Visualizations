import React, { useState } from 'react';
import { Upload } from 'lucide-react';

const CSVUploader = ({ onDataLoaded }) => {
  const [isDragging, setIsDragging] = useState(false);

  const parseCSV = (text) => {
    const lines = text.trim().split('\n');

    // Auto-detect delimiter: tab or comma
    const delimiter = lines[0].includes('\t') ? '\t' : ',';
    const headers = lines[0].split(delimiter);
    const rows = lines.slice(1).map(line => {
      const cells = line.split(delimiter);
      return Object.fromEntries(cells.map((cell, i) => [headers[i], cell]));
    });

    // 🔍 Debug logs
    console.log('Parsed headers:', headers);
    console.log('Parsed rows:', rows);

    return rows;
  };

  const handleFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const data = parseCSV(text);
      onDataLoaded(data);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleChange = (e) => {
    if (e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
        isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
      <h3 className="text-lg font-semibold mb-2">Upload CSV File</h3>
      <p className="text-gray-600 mb-4">Drag and drop or click to select</p>
      <input
        type="file"
        accept=".csv,.tsv,.txt"
        onChange={handleChange}
        className="hidden"
        id="file-upload"
      />
      <label
        htmlFor="file-upload"
        className="px-4 py-2 bg-blue-500 text-white rounded cursor-pointer hover:bg-blue-600"
      >
        Select File
      </label>
    </div>
  );
};

export default CSVUploader;
