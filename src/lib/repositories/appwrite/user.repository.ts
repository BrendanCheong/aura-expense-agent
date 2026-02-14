import type { TablesDB } from 'node-appwrite';
import { Query } from 'node-appwrite';
import type { IUserRepository } from '../interfaces';
import type { User, UserCreate, UserUpdate } from '@/types/user';
import type { UserRow } from '@/types/appwrite/rows';
import { APPWRITE_CONFIG } from '@/lib/appwrite/config';
import {
  mapRowToUser,
  mapUserToRow,
  mapUserUpdateToRow,
} from '@/lib/appwrite/mappers';

const DB_ID = APPWRITE_CONFIG.databaseId;
const TABLE_ID = APPWRITE_CONFIG.tables.users;

export class AppwriteUserRepository implements IUserRepository {
  constructor(private readonly tablesDb: TablesDB) {}

  async findById(id: string): Promise<User | null> {
    try {
      const row = await this.tablesDb.getRow<UserRow>({ databaseId: DB_ID, tableId: TABLE_ID, rowId: id });
      return mapRowToUser(row);
    } catch (err: unknown) {
      if (this.isNotFound(err)) return null;
      throw err;
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    const result = await this.tablesDb.listRows<UserRow>({
      databaseId: DB_ID,
      tableId: TABLE_ID,
      queries: [
        Query.equal('email', email),
        Query.limit(1),
      ],
    });

    if (result.rows.length === 0) return null;
    return mapRowToUser(result.rows[0]);
  }

  async create(id: string, data: UserCreate): Promise<User> {
    const rowData = mapUserToRow(data);
    rowData.inbound_email = `user-${id}@inbound.aura.app`;
    const row = await this.tablesDb.createRow<UserRow>({ databaseId: DB_ID, tableId: TABLE_ID, rowId: id, data: rowData });
    return mapRowToUser(row);
  }

  async update(id: string, data: UserUpdate): Promise<User> {
    const rowData = mapUserUpdateToRow(data);
    const row = await this.tablesDb.updateRow<UserRow>({ databaseId: DB_ID, tableId: TABLE_ID, rowId: id, data: rowData });
    return mapRowToUser(row);
  }

  private isNotFound(err: unknown): boolean {
    return typeof err === 'object' && err !== null && 'code' in err && (err as { code: number }).code === 404;
  }
}
