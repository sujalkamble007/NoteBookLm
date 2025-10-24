import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import mammoth from 'mammoth';
import ExcelJS from 'exceljs';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

class DocumentParser {
  /**
   * Parse document based on file type
   * @param {Object} file - Multer file object
   * @returns {Promise<string>} - Extracted text
   */
  async parseDocument(file) {
    try {
      const extension = path.extname(file.originalname).toLowerCase();
      
      switch (extension) {
        case '.pdf':
          return await this.parsePDF(file.path);
        case '.docx':
          return await this.parseDocx(file.path);
        case '.txt':
          return await this.parseTxt(file.path);
        case '.csv':
          return await this.parseCsv(file.path);
        case '.xlsx':
        case '.xls':
          return await this.parseExcel(file.path);
        default:
          throw new Error(`Unsupported file type: ${extension}`);
      }
    } catch (error) {
      console.error('Document parsing error:', error);
      throw new Error(`Failed to parse document: ${error.message}`);
    }
  }

  /**
   * Parse PDF file
   * @param {string} filePath - Path to PDF file
   * @returns {Promise<string>} - Extracted text
   */
  async parsePDF(filePath) {
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      return data.text;
    } catch (error) {
      throw new Error(`PDF parsing failed: ${error.message}`);
    }
  }

  /**
   * Parse DOCX file
   * @param {string} filePath - Path to DOCX file
   * @returns {Promise<string>} - Extracted text
   */
  async parseDocx(filePath) {
    try {
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value;
    } catch (error) {
      throw new Error(`DOCX parsing failed: ${error.message}`);
    }
  }

  /**
   * Parse TXT file
   * @param {string} filePath - Path to TXT file
   * @returns {Promise<string>} - File content
   */
  async parseTxt(filePath) {
    try {
      return fs.readFileSync(filePath, 'utf8');
    } catch (error) {
      throw new Error(`TXT parsing failed: ${error.message}`);
    }
  }

  /**
   * Parse CSV file
   * @param {string} filePath - Path to CSV file
   * @returns {Promise<string>} - CSV content as formatted text
   */
  async parseCsv(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Convert CSV to readable text format
      const lines = content.split('\n');
      const headers = lines[0]?.split(',') || [];
      
      let text = `Document contains ${lines.length - 1} records with columns: ${headers.join(', ')}\n\n`;
      
      // Add first few rows as sample
      const sampleRows = lines.slice(1, Math.min(6, lines.length));
      text += 'Sample data:\n';
      
      sampleRows.forEach((line, index) => {
        const values = line.split(',');
        text += `Row ${index + 1}:\n`;
        headers.forEach((header, i) => {
          text += `  ${header}: ${values[i] || 'N/A'}\n`;
        });
        text += '\n';
      });
      
      return text;
    } catch (error) {
      throw new Error(`CSV parsing failed: ${error.message}`);
    }
  }

  /**
   * Parse Excel file
   * @param {string} filePath - Path to Excel file
   * @returns {Promise<string>} - Excel content as formatted text
   */
  async parseExcel(filePath) {
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);
      
      let text = '';
      
      workbook.worksheets.forEach((worksheet, index) => {
        text += `Sheet ${index + 1}: ${worksheet.name}\n`;
        text += `Contains ${worksheet.rowCount} rows\n\n`;
        
        // Get headers from first row
        const headerRow = worksheet.getRow(1);
        const headers = [];
        headerRow.eachCell((cell, colNumber) => {
          headers[colNumber - 1] = cell.value?.toString() || `Column ${colNumber}`;
        });
        
        if (headers.length > 0) {
          text += `Columns: ${headers.join(', ')}\n\n`;
          
          // Add sample data (first 5 rows after header)
          const maxSampleRows = Math.min(6, worksheet.rowCount);
          text += 'Sample data:\n';
          
          for (let rowNumber = 2; rowNumber <= maxSampleRows; rowNumber++) {
            const row = worksheet.getRow(rowNumber);
            text += `Row ${rowNumber - 1}:\n`;
            
            headers.forEach((header, colIndex) => {
              const cell = row.getCell(colIndex + 1);
              const value = cell.value?.toString() || 'N/A';
              text += `  ${header}: ${value}\n`;
            });
            text += '\n';
          }
        }
        
        text += '\n---\n\n';
      });
      
      return text;
    } catch (error) {
      throw new Error(`Excel parsing failed: ${error.message}`);
    }
  }

  /**
   * Validate file type
   * @param {string} filename - Original filename
   * @returns {boolean} - Whether file type is supported
   */
  isValidFileType(filename) {
    const allowedExtensions = ['.pdf', '.docx', '.txt', '.csv', '.xlsx', '.xls'];
    const extension = path.extname(filename).toLowerCase();
    return allowedExtensions.includes(extension);
  }

  /**
   * Get file metadata
   * @param {Object} file - Multer file object
   * @returns {Object} - File metadata
   */
  getFileMetadata(file) {
    return {
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      extension: path.extname(file.originalname).toLowerCase(),
      uploadedAt: new Date()
    };
  }
}

export default new DocumentParser();