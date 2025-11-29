import { API_BASE_URL } from "@/config";
import { getAuthHeaders } from "@/lib/auth";

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  totalPages: number;
  page: number;
  limit: number;
}

export interface UserListItem {
  id: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role: string;
  status: 'active' | 'suspended' | 'pending';
  lastLogin?: string;
  last_login_at?: string;
  createdAt: string;
  updatedAt: string;
  created_at?: string;
  updated_at?: string;
  balance?: number;
  totalReferrals?: number;
  referrals_count?: number;
  email_verified_at?: string | null;
  name?: string;
  [key: string]: any;
}

export interface UserFilters {
  search?: string;
  status?: 'active' | 'inactive' | 'suspended' | 'pending';
  role?: 'admin' | 'partner' | 'user';
  registrationDateFrom?: string;
  registrationDateTo?: string;
  startDate?: string;
  endDate?: string;
}

export interface UpdateUserRequest {
  id: string;
  fullName?: string;
  email?: string;
  role?: string;
  status?: 'active' | 'inactive' | 'suspended';
}

class UserManagementService {
  private readonly baseUrl = `${API_BASE_URL}/users`;

  private buildQueryParams(page: number, limit: number, filters?: UserFilters): URLSearchParams {
    return new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(filters?.search && { search: filters.search }),
      ...(filters?.status && { status: filters.status }),
      ...(filters?.role && { role: filters.role }),
    });
  }

  private async handleErrorResponse(response: Response): Promise<never> {
    let errorMessage = `Error ${response.status}: ${response.statusText}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
    } catch {
    }
    throw new Error(`Failed to fetch users: ${errorMessage}`);
  }

  private extractUsersArray(data: any): any[] {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.items)) return data.items;

    console.warn('Unexpected API response format:', data);
    return [];
  }

  private mapToUserListItem(user: any): UserListItem {
    return {
      id: user.id?.toString() || '',
      fullName: user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'No Name',
      email: user.email || '',
      role: user.role || 'user',
      status: user.status || 'active',
      lastLogin: user.last_login_at || null,
      createdAt: user.created_at || new Date().toISOString(),
      updatedAt: user.updated_at || new Date().toISOString(),
      ...user
    };
  }

  private getPaginationData(data: any, users: UserListItem[], paginationLimit: number) {
    const meta = data?.meta || {};
    const itemsPerPage = meta.per_page ?? data?.limit ?? paginationLimit;
    const totalItems = meta.total ?? data?.total ?? users.length;

    return {
      total: totalItems,
      totalPages: meta.last_page ?? data?.totalPages ?? Math.ceil(totalItems / itemsPerPage),
      page: meta.current_page ?? data?.page ?? 1,
      limit: itemsPerPage,
    };
  }

  async getUsers(
    page = 1,
    limit = 20,
    filters?: UserFilters,
    pagination = { limit: 20 }
  ): Promise<PaginatedResponse<UserListItem>> {
    try {
      const params = this.buildQueryParams(page, limit, filters);
      const url = `${this.baseUrl}?${params}`;
      const headers = getAuthHeaders();

      const response = await fetch(url, { method: 'GET', headers });
      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      const data = await response.json();
      const usersArray = this.extractUsersArray(data);
      if (!usersArray.length) {
        return {
          items: [],
          total: 0,
          totalPages: 0,
          page: 1,
          limit: 20,
        };
      }

      const users = usersArray.map(user => this.mapToUserListItem(user));
      const paginationData = this.getPaginationData(data, users, pagination.limit);

      return {
        items: users,
        ...paginationData
      };
    } catch (error) {
      console.error('Error in getUsers:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new Error(`Failed to fetch users: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getUserById(id: string): Promise<UserListItem> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Error fetching user: ${response.statusText}`);
      }

      const { data: user } = await response.json();

      return {
        id: user.id.toString(),
        fullName: user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'No Name',
        email: user.email,
        role: user.role || 'user',
        status: user.status || 'active',
        lastLogin: user.last_login_at || null,
        createdAt: user.created_at || new Date().toISOString(),
        updatedAt: user.updated_at || new Date().toISOString(),
        ...user
      };
    } catch (error) {
      console.error(`Error fetching user ${id}:`, error);
      throw error;
    }
  }

  async suspendUser(userId: string): Promise<UserListItem> {
    return this.updateUserStatus(userId, 'suspended');
  }

  async activateUser(userId: string): Promise<UserListItem> {
    return this.updateUserStatus(userId, 'active');
  }

  private async updateUserStatus(userId: string, status: 'active' | 'suspended'): Promise<UserListItem> {
    const response = await fetch(`${this.baseUrl}/${userId}/status`, {
      method: 'PATCH',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      throw new Error(`Error updating user status: ${response.statusText}`);
    }

    const { data: user } = await response.json();
    return this.transformUser(user);
  }

  async updateUser(userId: string, data: UpdateUserRequest): Promise<UserListItem> {
    try {
      const response = await fetch(`${this.baseUrl}/${userId}`, {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.fullName,
          email: data.email,
          role: data.role,
          status: data.status,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error updating user: ${response.statusText}`);
      }

      const { data: user } = await response.json();

      return {
        id: user.id.toString(),
        fullName: user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'No Name',
        email: user.email,
        role: user.role || 'user',
        status: user.status || 'active',
        lastLogin: user.last_login_at || null,
        createdAt: user.created_at || new Date().toISOString(),
        updatedAt: user.updated_at || new Date().toISOString(),
        ...user
      };
    } catch (error) {
      console.error(`Error updating user ${userId}:`, error);
      throw error;
    }
  }

  async deleteUser(userId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${userId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Error deleting user: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error deleting user ${userId}:`, error);
      throw error;
    }
  }

  async exportUsers(filters?: UserFilters): Promise<Blob> {
    try {
      const response = await fetch(`${this.baseUrl}/export`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
        body: JSON.stringify(filters),
      });

      if (!response.ok) {
        throw new Error(`Error exporting users: ${response.statusText}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('Error exporting users:', error);
      throw error;
    }
  }

  private transformUser(user: any): UserListItem {
    return {
      id: user.id.toString(),
      fullName: user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'No Name',
      email: user.email,
      role: user.role || 'user',
      status: user.status || 'active',
      lastLogin: user.last_login_at || null,
      createdAt: user.created_at || new Date().toISOString(),
      updatedAt: user.updated_at || new Date().toISOString(),
      balance: user.balance || 0,
      totalReferrals: user.referrals_count || 0,
      ...user
    };
  }
}

export const userManagementService = new UserManagementService();
