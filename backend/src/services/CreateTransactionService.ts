import { getCustomRepository, getRepository } from 'typeorm';
import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import Category from '../models/Category';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface Request {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);

    const types = ['income', 'outcome'];
    if (!types.includes(type)) {
      throw new Error('Transaction type is invalid');
    }

    const { total } = await transactionsRepository.getBalance();

    if (type === 'outcome' && total < value) {
      throw new AppError('You do not have enough balance');
    }

    const categoriesRepository = getRepository(Category);

    let categoryTransaction = await categoriesRepository.findOne({
      where: { title: category },
    });
    if (!categoryTransaction) {
      categoryTransaction = categoriesRepository.create({
        title: category,
      });
      await categoriesRepository.save(categoryTransaction);
    }

    const transaction = transactionsRepository.create({
      title,
      value,
      type,
      category: categoryTransaction,
    });

    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
