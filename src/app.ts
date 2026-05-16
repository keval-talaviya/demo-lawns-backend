import express from 'express';
import path from 'path';
import compression from 'compression';
import cors from 'cors';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import './config';
import { errorHandler } from './middlewares/errorHandler';
import { requestLogger } from './middlewares/requestLogger';
import routes from './routes';
import { defaultRateLimiter } from './common/rateLimiter';

const app = express();

app.set('trust proxy', 1);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-access-token', 'Accept'],
  credentials: false   // cannot use credentials with "*"
}));
app.use(compression());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
// app.use(morgan('combined'));
// app.use(requestLogger);
app.use(defaultRateLimiter);

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.get('/', (_req, res) => {
  console.log('DEBUG: GET / hit in app.ts het in');
  res.render('index', { title: 'Express TypeScript Starter' });
  console.log('DEBUG: GET / hit in app.ts het out');
});

app.use('/api', routes);

app.use(errorHandler);

export default app;

