import { METHOD, STATUS_CODE } from "../../../support/api/api-const";
import API from "../../../support/ApiUrls";

context("Tokens", () => {
    const authorization = Cypress.env("authorization");
    const user = Cypress.env("root_user");

    it("Freezes/Unfreezes transfers of the specified token for the user", () => {
        cy.sendRequest(METHOD.GET,Cypress.env("api_server") + API.ListOfTokens, { authorization }).then(
            (resp) => {
                expect(resp.status).eql(STATUS_CODE.OK);

                const tokenId = resp.body[0].tokenId;

                cy.sendRequest(
                    METHOD.PUT,
                    Cypress.env("api_server") + API.ListOfTokens + tokenId + "/" + user + "/freeze",
                    { authorization }
                ).then((resp) => {
                    expect(resp.status).eql(STATUS_CODE.OK);

                    let token = resp.body.tokenId;
                    let frozen = resp.body.frozen;

                    expect(token).to.deep.equal(tokenId);
                    expect(frozen).to.be.true;

                    cy.sendRequest(
                        METHOD.PUT,
                        Cypress.env("api_server") + API.ListOfTokens + tokenId + "/" + user + "/unfreeze",
                        { authorization }
                    ).then((resp) => {
                        expect(resp.status).eql(STATUS_CODE.OK);
            
                        let token = resp.body.tokenId;
                        let frozen = resp.body.frozen;
            
                        expect(token).to.deep.equal(tokenId);
                        expect(frozen).to.be.false;
                    });
                });
            }
        );
    });
});