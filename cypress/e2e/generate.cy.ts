// cypress/e2e/generate.cy.ts
describe("AI Studio App Flow", () => {
  beforeEach(() => {
    cy.visit("http://localhost:5173/", { timeout: 5000 }); // wait up to 20s for page to load
  });

  it("should handle generate, error, retries, history, clear, and abort", () => {
    // Wait for Generate button to appear before starting
    cy.get('[data-testid="generate-btn"]', { timeout: 5000 }).should("be.visible");

    // Helper: fill form before generating
    const fillForm = () => {
      // 1. Upload image
      const imageFile = "test-image.jpg"; // Place in cypress/fixtures/
      cy.get("#file").attachFile(imageFile);

      // 2. Type prompt
      cy.get("#prompt").clear().type("Explain this image");

      // 3. Select second style option (Streetwear)
      cy.get("#style").select(1);
    };


    // Helper: assert summary has correct image, prompt, and style
    const assertSummary = (promptText: string, styleText: string) => {
      // Image exists (not empty state)
      cy.get('[data-testid="summary"]')
        .find('img')
        .should('exist');

      // Prompt matches
      cy.get('[data-testid="prompt"]')
        .should('contain.text', `Prompt: ${promptText}`);

      // Style matches
      cy.get('[data-testid="style"]')
        .should('contain.text', `Style: ${styleText}`);
    };


    // 1. Click Generate 3 times → each time correct result
    for (let i = 0; i < 5; i++) {
      fillForm()
      cy.get('[data-testid="generate-btn"]').click();
      // Wait until spinner disappears (or timeout after 15s)
      cy.get('[data-testid="spinner"]', { timeout: 15000 })
        .should('not.exist');
      if (i == 3) {
        cy.get('[data-testid="error-message"]', { timeout: 5000 }).should(
          "contain",
          "Model overloaded"
        );
      } else {
        assertSummary('Explain this image', "Streetwear")
      }
    }

    // 4. Go to History → select another result
    cy.get('[data-testid="history-item"]', { timeout: 5000 }).eq(0).click();
    assertSummary('Explain this image', "Streetwear")

    // 5. Clear button
    cy.get('[data-testid="clear-btn"]').click();
    cy.get('[data-testid="history-item"]', { timeout: 5000 }).should("not.exist");

    // 6. Abort button
    cy.get('[data-testid="generate-btn"]').click();
    cy.get('[data-testid="abort-btn"]').click();
    cy.get('[data-testid="spinner"]', { timeout: 15000 })
        .should('not.exist');
        cy.get('[data-testid="generate-btn"]').should('not.be.disabled');
  });
});
