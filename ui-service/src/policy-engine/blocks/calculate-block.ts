import { DocumentSignature, Schema, SchemaHelper } from 'interfaces';
import { CalculateBlock } from '@policy-engine/helpers/decorators';
import { PolicyValidationResultsContainer } from '@policy-engine/policy-validation-results-container';
import { PolicyComponentsStuff } from '@policy-engine/policy-components-stuff';
import { IPolicyCalculateBlock } from '@policy-engine/policy-engine.interface';
import { BlockActionError } from '@policy-engine/errors';
import { HcsVcDocument, VcSubject } from 'vc-modules';
import { VcHelper } from '@helpers/vcHelper';
import { Guardians } from '@helpers/guardians';
import { Inject } from '@helpers/decorators/inject';

@CalculateBlock({
    blockType: 'calculateContainerBlock',
    commonBlock: true
})
export class CalculateContainerBlock {
    @Inject()
    private guardians: Guardians;

    async calculate(document: any) {
        const ref = PolicyComponentsStuff.GetBlockRef<IPolicyCalculateBlock>(this);
        if (document.signature === DocumentSignature.INVALID) {
            throw new BlockActionError('Invalid VC proof', ref.blockType, ref.uuid);
        }

        const VC = HcsVcDocument.fromJsonTree(document.document, null, VcSubject);
        const json = VC.getCredentialSubject()[0].toJsonTree();

        let scope = {};
        if (ref.options.inputFields) {
            for (let i = 0; i < ref.options.inputFields.length; i++) {
                const field = ref.options.inputFields[i];
                scope[field.value] = json[field.name];
            }
        }
        console.log("calculate-block, scope", scope);
        const addons = ref.getAddons();
        for (let i = 0; i < addons.length; i++) {
            const addon = addons[i];
            scope = await addon.run(scope);
            console.log("calculate-block, scope", scope);
        }

        let newJson = {};
        if (ref.options.outputFields) {
            for (let i = 0; i < ref.options.outputFields.length; i++) {
                const field = ref.options.outputFields[i];
                newJson[field.name] = scope[field.value];
            }
        }
        console.log("calculate-block, newJson", newJson);

        const outputSchema = await this.guardians.getSchemaByIRI(ref.options.outputSchema);
        const vcSubject = {
            ...SchemaHelper.getContext(outputSchema),
            ...newJson
        }
        console.log("calculate-block, vcSubject", vcSubject);

        const root = await this.guardians.getRootConfig(ref.policyOwner);
        const vcHelper = new VcHelper();
        const newVC = await vcHelper.createVC(
            root.did,
            root.hederaAccountKey,
            vcSubject
        );
        const item = {
            hash: newVC.toCredentialHash(),
            owner: document.owner,
            document: newVC.toJsonTree(),
            schema: outputSchema.iri,
            type: outputSchema.iri,
            policyId: ref.policyId,
            tag: ref.tag
        };
        return item;
    }

    public async runAction(state, user) {
        console.log("calculate-block, runAction")
        const ref = PolicyComponentsStuff.GetBlockRef<IPolicyCalculateBlock>(this);
        let document = null;
        if (Array.isArray(state.data)) {
            document = state.data[0];
        } else {
            document = state.data;
        }
        console.log("calculate-block, document", JSON.stringify(document, null, 4));
        const newDocument = await this.calculate(document);
        console.log("calculate-block, newDocument", JSON.stringify(newDocument, null, 4));
        state.data = newDocument;
        await ref.runNext(user, state);
        ref.updateBlock(state, user, '');
    }

    public async validate(resultsContainer: PolicyValidationResultsContainer): Promise<void> {
        const ref = PolicyComponentsStuff.GetBlockRef<IPolicyCalculateBlock>(this);

        // Test schema options
        if (!ref.options.inputSchema) {
            resultsContainer.addBlockError(ref.uuid, 'Option "inputSchema" does not set');
            return;
        }
        if (typeof ref.options.inputSchema !== 'string') {
            resultsContainer.addBlockError(ref.uuid, 'Option "inputSchema" must be a string');
            return;
        }
        const inputSchema = await this.guardians.getSchemaByIRI(ref.options.inputSchema);
        if (!inputSchema) {
            resultsContainer.addBlockError(ref.uuid, `Schema with id "${ref.options.inputSchema}" does not exist`);
            return;
        }

        // Test schema options
        if (!ref.options.outputSchema) {
            resultsContainer.addBlockError(ref.uuid, 'Option "outputSchema" does not set');
            return;
        }
        if (typeof ref.options.outputSchema !== 'string') {
            resultsContainer.addBlockError(ref.uuid, 'Option "outputSchema" must be a string');
            return;
        }
        const outputSchema = await this.guardians.getSchemaByIRI(ref.options.outputSchema);
        if (!outputSchema) {
            resultsContainer.addBlockError(ref.uuid, `Schema with id "${ref.options.outputSchema}" does not exist`);
            return;
        }

        let variables: any = {};
        if (ref.options.inputFields) {
            for (let i = 0; i < ref.options.inputFields.length; i++) {
                const field = ref.options.inputFields[i];
                variables[field.value] = field.name;
            }
        }

        const addons = ref.getAddons();
        for (let i = 0; i < addons.length; i++) {
            const addon = addons[i];
            variables = await addon.getVariables(variables);
        }

        const map = {};
        if (ref.options.outputFields) {
            for (let i = 0; i < ref.options.outputFields.length; i++) {
                const field = ref.options.outputFields[i];
                if (!field.value) {
                    continue;
                }
                if (!variables.hasOwnProperty(field.value)) {
                    resultsContainer.addBlockError(ref.uuid, `Variable ${field.value} not defined`);
                    return;
                }
                map[field.name] = true;
            }
        }

        const schema = new Schema(outputSchema);
        for (let i = 0; i < schema.fields.length; i++) {
            const field = schema.fields[i];
            if (field.required && !map[field.name]) {
                resultsContainer.addBlockError(ref.uuid, `${field.description} is required`);
                return
            }
        }
    }
}