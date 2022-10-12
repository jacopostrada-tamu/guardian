import { METHOD, STATUS_CODE } from "../../../support/api/api-const";
import API from "../../../support/ApiUrls";

context("Schemas", () => {
    const authorization = Cypress.env("authorization");
    const username = "StandartRegistry";
    const schemaUUID = "9999b23a-b1ea-408f-a573-6d8bd1a2060a";

    it("Makes the created scheme active", () => {
        //Create new schema
        cy.request({
            method: "POST",
            url: Cypress.env("api_server") + API.SchemasSystem + username,
            headers: { authorization },
            body: {
                uuid: schemaUUID,
                description: "new",
                hash: "",
                status: "DRAFT",
                readonly: false,
                name: "test",
                entity: "USER",
                document:
                    '{"$id":"#${schemaUUID}","$comment":"{\\"term\\": \\"${schemaUUID}\\", \\"@id\\": \\"https://localhost/schema#${schemaUUID}\\"}","title":"test","description":" test","type":"object","properties":{"@context":{"oneOf":[{"type":"string"},{"type":"array","items":{"type":"string"}}],"readOnly":true},"type":{"oneOf":[{"type":"string"},{"type":"array","items":{"type":"string"}}],"readOnly":true},"id":{"type":"string","readOnly":true},"field0":{"title":"test field","description":"test field","readOnly":false,"$comment":"{\\"term\\": \\"field0\\", \\"@id\\": \\"https://www.schema.org/text\\"}","type":"string"}},"required":["@context","type"],"additionalProperties":false}',
            },
        }).then((response) => {
            expect(response.status).eql(STATUS_CODE.SUCCESS);

            cy.request({
                method: METHOD.GET,
                url: Cypress.env("api_server") + API.SchemasSystem + username,
                headers: {
                    authorization,
                },
            }).then((resp) => {
                expect(resp.status).eql(STATUS_CODE.OK);
                expect(resp.body[0]).to.have.property("uuid");

                let schemaId = resp.body.at(-1).id;

                const versionNum = "1." + Math.floor(Math.random() * 999);

                cy.request({
                    method: "PUT",
                    url:
                        Cypress.env("api_server") +
                        API.SchemasSystem +
                        schemaId +
                        "/active",
                    headers: { authorization },
                    body: {
                        version: versionNum,
                    },
                }).then((response) => {
                    expect(response.status).eql(STATUS_CODE.OK);
                });
            });
        });
    });
});