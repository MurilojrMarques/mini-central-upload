import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import routes from './routes/index.js';

const app = express();
const PORT = process.env.PORT || 3000;
app.use(helmet()); 

app.use(cors({
  origin: '*', 
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));

app.use(express.json({ limit: '2mb' })); 

app.use('/api', routes);

app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Rota não encontrada.' });
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Erro não tratado:', err);
  
  res.status(500).json({ 
    error: 'Erro interno no servidor.',
  });
});


app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Pré-voo disponível em: http://localhost:${PORT}/api/preflight`);
});