import { defineTool } from 'genkit';
import { z } from 'zod';

// Simplified Zod schema for a Pet
const PetSchema = z.object({
  id: z.number().int().positive().describe("The unique numeric identifier for the pet."),
  name: z.string().describe("The pet's given name."),
  status: z.enum(['available', 'pending', 'sold']).describe("The current availability status of the pet: 'available', 'pending', or 'sold'."),
  // category: z.object({ id: z.number(), name: z.string() }).optional(),
  // photoUrls: z.array(z.string().url()).optional(),
  // tags: z.array(z.object({ id: z.number(), name: z.string() })).optional(),
}).describe("Schema representing a pet with its ID, name, and status.");

// Input schema for getPetById
const GetPetByIdInputSchema = z.object({
  petId: z.number().int().positive().describe("The numeric ID of the pet to retrieve."),
});

// Output schema for getPetById (which is a Pet)
const GetPetByIdOutputSchema = PetSchema;

// Input schema for addPet (simplified Pet, name and status are required)
const AddPetInputSchema = z.object({
  name: z.string().describe("The desired name for the new pet."),
  status: z.enum(['available', 'pending', 'sold']).describe("The desired status for the new pet ('available', 'pending', or 'sold')."),
  // photoUrls: z.array(z.string().url()).describe("Image URLs for the new Pet"),
  // id can be omitted as it's usually assigned by the server
  // category and tags can be omitted for simplicity in this example
});

// Output schema for addPet (which is the created Pet)
const AddPetOutputSchema = PetSchema;

export const petStoreTool = defineTool(
  {
    name: 'petStoreTool',
    description: 'Simulates interactions with a Pet Store API. Allows fetching pet details by ID and adding new pets. This is a mocked tool and does not interact with a real API.',
    actions: {
      getPetById: {
        description: "Retrieves a pet's details (ID, name, status) given its numeric ID. (Mocked - returns a sample pet or an error if petId is 0).",
        inputSchema: GetPetByIdInputSchema,
        outputSchema: GetPetByIdOutputSchema,
        async fn({ petId }: z.infer<typeof GetPetByIdInputSchema>): Promise<z.infer<typeof GetPetByIdOutputSchema>> {
          // Mocked implementation
          console.log(`[petStoreTool.getPetById] Called with petId: ${petId}`);
          // Simulate finding a pet
          if (petId === 0) { // Simulate not found for a specific ID for testing
            throw new Error(`Pet with ID ${petId} not found (mocked).`);
          }
          return {
            id: petId,
            name: `MockPet-${petId}`,
            status: 'available',
          };
        },
      },
      addPet: {
        description: "Adds a new pet to the store with the given name and status (available, pending, or sold). Returns the details of the newly created pet including a unique ID. (Mocked - generates a random ID).",
        inputSchema: AddPetInputSchema,
        outputSchema: AddPetOutputSchema,
        async fn(input: z.infer<typeof AddPetInputSchema>): Promise<z.infer<typeof AddPetOutputSchema>> {
          // Mocked implementation
          console.log(`[petStoreTool.addPet] Called with input:`, input);
          const newPetId = Math.floor(Math.random() * 1000) + 1; // Generate a random ID
          return {
            id: newPetId,
            name: input.name,
            status: input.status,
          };
        },
      },
    },
  }
);

export default petStoreTool;
