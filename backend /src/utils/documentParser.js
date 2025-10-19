import fs from 'fs/promises';
import path from 'path';
import csvParser from 'csv-parser';
import mammoth from 'mammoth';
import { createReadStream } from 'fs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');

export class DocumentParser {
  
  /**
   * Extract text content from Cloudinary URL
   */
  static async extractTextFromUrl(cloudinaryUrl, fileType, mimeType) {
    try {
      // Download file from Cloudinary
      const response = await fetch(cloudinaryUrl);
      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.statusText}`);
      }
      
      const buffer = await response.arrayBuffer();
      const tempPath = `/tmp/temp_${Date.now()}.${fileType}`;
      
      // Write to temporary file for processing
      await fs.writeFile(tempPath, Buffer.from(buffer));
      
      try {
        // Extract text using existing methods
        const result = await this.extractText(tempPath, fileType, mimeType);
        return result;
      } finally {
        // Clean up temporary file
        await this.cleanupFile(tempPath);
      }
    } catch (error) {
      console.error('Error extracting text from URL:', error);
      throw new Error(`Failed to extract text from URL: ${error.message}`);
    }
  }

  /**
   * Extract text content from different file types
   */
  static async extractText(filePath, fileType, mimeType) {
    try {
      switch (fileType.toLowerCase()) {
        case 'pdf':
          return await this.extractFromPDF(filePath);
        
        case 'docx':
        case 'doc':
          return await this.extractFromWord(filePath);
        
        case 'csv':
          return await this.extractFromCSV(filePath);
        
        case 'txt':
          return await this.extractFromText(filePath);
        
        case 'xlsx':
        case 'xls':
          return await this.extractFromExcel(filePath);
        
        default:
          throw new Error(`Unsupported file type: ${fileType}`);
      }
    } catch (error) {
      console.error('Error extracting text:', error);
      throw new Error(`Failed to extract text from ${fileType} file: ${error.message}`);
    }
  }

  /**
   * Extract text from PDF files
   */
  static async extractFromPDF(filePath) {
    try {
      const dataBuffer = await fs.readFile(filePath);
      const data = await pdf(dataBuffer);
      
      return {
        text: data.text,
        metadata: {
          pages: data.numpages,
          info: data.info,
          wordCount: this.countWords(data.text)
        }
      };
    } catch (error) {
      throw new Error(`PDF parsing failed: ${error.message}`);
    }
  }

  /**
   * Extract text from Word documents (DOCX)
   */
  static async extractFromWord(filePath) {
    try {
      const result = await mammoth.extractRawText({ path: filePath });
      const text = result.value;
      
      return {
        text,
        metadata: {
          wordCount: this.countWords(text),
          warnings: result.messages
        }
      };
    } catch (error) {
      throw new Error(`Word document parsing failed: ${error.message}`);
    }
  }

  /**
   * Extract text from CSV files
   */
  static async extractFromCSV(filePath) {
    try {
      return new Promise((resolve, reject) => {
        const results = [];
        const headers = [];
        let isFirstRow = true;

        createReadStream(filePath)
          .pipe(csvParser())
          .on('headers', (headerList) => {
            headers.push(...headerList);
          })
          .on('data', (data) => {
            results.push(data);
          })
          .on('end', () => {
            // Convert CSV data to readable text
            const textContent = this.csvToText(results, headers);
            
            resolve({
              text: textContent,
              structuredData: {
                headers,
                rows: results,
                rowCount: results.length
              },
              metadata: {
                columns: headers.length,
                rows: results.length,
                wordCount: this.countWords(textContent)
              }
            });
          })
          .on('error', (error) => {
            reject(new Error(`CSV parsing failed: ${error.message}`));
          });
      });
    } catch (error) {
      throw new Error(`CSV parsing failed: ${error.message}`);
    }
  }

  /**
   * Extract text from plain text files
   */
  static async extractFromText(filePath) {
    try {
      const text = await fs.readFile(filePath, 'utf-8');
      
      return {
        text,
        metadata: {
          wordCount: this.countWords(text),
          lineCount: text.split('\n').length
        }
      };
    } catch (error) {
      throw new Error(`Text file reading failed: ${error.message}`);
    }
  }

  /**
   * Extract text from Excel files (basic implementation)
   */
  static async extractFromExcel(filePath) {
    // Note: This is a placeholder. For full Excel support, you'd want to use a library like 'exceljs'
    try {
      // For now, treat as text and try to read what we can
      const buffer = await fs.readFile(filePath);
      const text = buffer.toString('utf-8', 0, Math.min(1000, buffer.length));
      
      return {
        text: 'Excel file detected. Full parsing not implemented yet.',
        metadata: {
          fileSize: buffer.length,
          wordCount: 0,
          note: 'Excel parsing requires additional implementation'
        }
      };
    } catch (error) {
      throw new Error(`Excel file processing failed: ${error.message}`);
    }
  }

  /**
   * Convert CSV data to readable text
   */
  static csvToText(data, headers) {
    if (!data || data.length === 0) return '';
    
    let text = `CSV Data Summary:\n`;
    text += `Headers: ${headers.join(', ')}\n\n`;
    
    // Add first few rows as sample
    const sampleRows = data.slice(0, Math.min(5, data.length));
    sampleRows.forEach((row, index) => {
      text += `Row ${index + 1}:\n`;
      headers.forEach(header => {
        if (row[header]) {
          text += `  ${header}: ${row[header]}\n`;
        }
      });
      text += '\n';
    });
    
    if (data.length > 5) {
      text += `... and ${data.length - 5} more rows\n`;
    }
    
    return text;
  }

  /**
   * Count words in text
   */
  static countWords(text) {
    if (!text || typeof text !== 'string') return 0;
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Extract key information and entities from text
   */
  static extractKeyInfo(text) {
    if (!text || typeof text !== 'string') {
      return {
        keyPhrases: [],
        entities: [],
        summary: ''
      };
    }

    // Simple keyword extraction (in production, you'd use NLP libraries)
    const words = text.toLowerCase().split(/\W+/);
    const wordFreq = {};
    
    // Count word frequency (excluding common words)
    const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'shall']);
    
    words.forEach(word => {
      if (word.length > 3 && !commonWords.has(word)) {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      }
    });

    // Get top keywords
    const keyPhrases = Object.entries(wordFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);

    // Simple entity extraction (emails, dates, etc.)
    const entities = [];
    
    // Extract email addresses
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const emails = text.match(emailRegex) || [];
    emails.forEach(email => {
      entities.push({ text: email, type: 'email' });
    });

    // Extract dates (simple patterns)
    const dateRegex = /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/g;
    const dates = text.match(dateRegex) || [];
    dates.forEach(date => {
      entities.push({ text: date, type: 'date' });
    });

    // Generate simple summary (first sentence or first 200 characters)
    const sentences = text.split(/[.!?]+/);
    const summary = sentences[0]?.trim() || text.substring(0, 200).trim() + '...';

    return {
      keyPhrases,
      entities,
      summary: summary.length > 10 ? summary : ''
    };
  }

  /**
   * Chunk text for vector embeddings
   */
  static chunkText(text, chunkSize = 1000, overlap = 200) {
    if (!text || typeof text !== 'string') return [];
    
    const chunks = [];
    const words = text.split(/\s+/);
    
    for (let i = 0; i < words.length; i += chunkSize - overlap) {
      const chunk = words.slice(i, i + chunkSize).join(' ');
      if (chunk.trim().length > 0) {
        chunks.push({
          text: chunk,
          startIndex: i,
          endIndex: Math.min(i + chunkSize, words.length),
          chunkId: `chunk_${chunks.length}`
        });
      }
    }
    
    return chunks;
  }

  /**
   * Calculate file checksum for duplicate detection
   */
  static async calculateChecksum(filePath) {
    try {
      const crypto = await import('crypto');
      const buffer = await fs.readFile(filePath);
      const hash = crypto.createHash('md5');
      hash.update(buffer);
      return hash.digest('hex');
    } catch (error) {
      console.error('Error calculating checksum:', error);
      return null;
    }
  }

  /**
   * Clean up temporary files
   */
  static async cleanupFile(filePath) {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.error('Error cleaning up file:', filePath, error);
    }
  }
}