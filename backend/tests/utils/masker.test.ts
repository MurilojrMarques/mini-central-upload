import { describe, it, expect } from 'vitest';
import { maskSecret } from '../../src/utils/masker.js';

describe('maskSecret', () => {
  it('mostra apenas os últimos caracteres (default: 4)', () => {
    const result = maskSecret('token_secreto_123');
    expect(result.endsWith('_123')).toBe(true);
    expect(result.startsWith('*')).toBe(true);
  });

  it('mascara tudo quando o valor é menor ou igual ao visível', () => {
    expect(maskSecret('abc')).toBe('***');
    expect(maskSecret('abcd')).toBe('****');
  });

  it('respeita o parâmetro visible customizado', () => {
    expect(maskSecret('senha12345', 2)).toBe('********45');
  });

  it('devolve string vazia para entrada vazia', () => {
    expect(maskSecret('')).toBe('');
  });

  it('nunca expõe o miolo do segredo', () => {
    const secret = 'proxy-alpha.test:8001';
    const masked = maskSecret(secret);
    expect(masked).not.toBe(secret);
    expect(masked).not.toContain('proxy-alpha');
  });

  it('preserva o comprimento original (não encurta o segredo)', () => {
    const secret = 'token_super_longo_secreto';
    expect(maskSecret(secret).length).toBe(secret.length);
  });
});