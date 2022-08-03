import { Schema } from '@entity/schema';
import { DocumentLoader, IDocumentFormat } from '@hedera-modules';
import { getMongoRepository } from 'typeorm';

/**
 * Schema Documents Loader
 * Used for signatures validation.
 */
export class SchemaDocumentLoader extends DocumentLoader {
    /**
     * Has context
     * @param iri
     */
    public async has(iri: string): Promise<boolean> {
        return iri.startsWith('schema#');
    }

    /**
     * Get formatted document
     * @param iri
     */
    public async get(iri: string): Promise<IDocumentFormat> {
        return {
            documentUrl: iri,
            document: await this.getDocument(iri)
        };
    }

    /**
     * Get document
     * @param iri
     */
    public async getDocument(iri: string): Promise<any> {
        const _iri = iri.substring(6);
        const schema = await getMongoRepository(Schema).findOne({
            iri: _iri
        });
        if (schema) {
            console.log(schema.context);
            return schema.context;
        }
        throw new Error(`Schema not found: ${iri}`);
    }
}
