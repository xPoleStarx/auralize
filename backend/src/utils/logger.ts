import winston from 'winston';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';

// .env'den log seviyesini al, yoksa 'info' kullan
const logLevel = process.env.LOG_LEVEL || 'info';

// Log dosyaları için dizinleri oluştur
const LOG_DIR = path.join(process.cwd(), 'logs');

// Dizinin varlığını kontrol et
const exists = promisify(fs.exists);
const mkdir = promisify(fs.mkdir);

// Dizinin varlığını kontrol et, yoksa oluştur
const ensureLogDirectory = async () => {
  try {
    if (!(await exists(LOG_DIR))) {
      await mkdir(LOG_DIR, { recursive: true });
    }
  } catch (error) {
    console.error('Log dizini oluşturulamadı:', error);
  }
};

// Log dizinini oluştur
ensureLogDirectory();

// Winston logger formatı
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Winston logger yapılandırması
const logger = winston.createLogger({
  level: logLevel,
  format: logFormat,
  defaultMeta: { service: 'auralize-api' },
  transports: [
    // Konsolda göster
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(
          ({ timestamp, level, message, ...rest }) => {
            return `${timestamp} ${level}: ${message} ${
              Object.keys(rest).length ? JSON.stringify(rest, null, 2) : ''
            }`;
          }
        )
      ),
    }),
    // info.log dosyasına tüm logları yaz
    new winston.transports.File({ 
      filename: path.join(LOG_DIR, 'info.log') 
    }),
    // error.log dosyasına sadece hataları yaz
    new winston.transports.File({ 
      filename: path.join(LOG_DIR, 'error.log'), 
      level: 'error' 
    }),
  ],
});

export default logger; 