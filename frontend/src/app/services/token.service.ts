import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { IToken, ITokenInfo, IUser } from '@guardian/interfaces';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './api';

/**
 * Services for working from Tokens.
 */
@Injectable()
export class TokenService {
    private readonly url: string = `${API_BASE_URL}/tokens`;

    constructor(
        private http: HttpClient
    ) {
    }

    public create(data: any): Observable<IToken[]> {
        return this.http.post<IToken[]>(`${this.url}`, data);
    }

    public pushCreate(data: any): Observable<{ taskId: string, expectation: number }> {
        return this.http.post<{ taskId: string, expectation: number }>(`${this.url}/push/`, data);
    }

    public getTokens(policyId?: string): Observable<ITokenInfo[]> {
        if (policyId) {
            return this.http.get<ITokenInfo[]>(`${this.url}?policy=${policyId}`);
        }
        return this.http.get<ITokenInfo[]>(`${this.url}`);
    }

    public associate(tokenId: string, associate: boolean): Observable<void> {
        if (associate) {
            return this.http.put<void>(`${this.url}/${tokenId}/associate`, null);
        } else {
            return this.http.put<void>(`${this.url}/${tokenId}/dissociate`, null);
        }
    }

    public pushAssociate(tokenId: string, associate: boolean): Observable<{ taskId: string, expectation: number }> {
        if (associate) {
            return this.http.put<{ taskId: string, expectation: number }>(`${this.url}/push/${tokenId}/associate`, null);
        } else {
            return this.http.put<{ taskId: string, expectation: number }>(`${this.url}/push/${tokenId}/dissociate`, null);
        }
    }

    public kyc(tokenId: string, username: string, kyc: boolean): Observable<void> {
        if (kyc) {
            return this.http.put<void>(`${this.url}/${tokenId}/${username}/grantKyc`, null);
        } else {
            return this.http.put<void>(`${this.url}/${tokenId}/${username}/revokeKyc`, null);
        }
    }

    public pushKyc(tokenId: string, username: string, kyc: boolean): Observable<{ taskId: string, expectation: number }> {
        if (kyc) {
            return this.http.put<{ taskId: string, expectation: number }>(`${this.url}/push/${tokenId}/${username}/grantKyc`, null);
        } else {
            return this.http.put<{ taskId: string, expectation: number }>(`${this.url}/push/${tokenId}/${username}/revokeKyc`, null);
        }
    };

    public freeze(tokenId: string, username: string, freeze: boolean): Observable<void> {
        if (freeze) {
            return this.http.put<void>(`${this.url}/${tokenId}/${username}/freeze`, null);
        } else {
            return this.http.put<void>(`${this.url}/${tokenId}/${username}/unfreeze`, null);
        }
    }

    public info(tokenId: string, username: string): Observable<ITokenInfo> {
        return this.http.get<ITokenInfo>(`${this.url}/${tokenId}/${username}/info`);
    }
}
