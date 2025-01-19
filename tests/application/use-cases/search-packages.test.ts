import { SearchPackagesUseCase } from "../../src/application/use-cases/search-packages.use-case";
import { RemoteRepository } from "../../src/infrastructure/repositories/remote.repository";

jest.mock("../../src/infrastructure/repositories/remote.repository");

describe("SearchPackagesUseCase", () => {
  it("should return packages for valid search terms", async () => {
    const mockRepo = new RemoteRepository();
    jest
      .spyOn(mockRepo, "searchPackages")
      .mockResolvedValue([
        { url: "https://example.com/package1", alias: "package1", rating: 4 },
      ]);

    const useCase = new SearchPackagesUseCase(mockRepo);
    const results = await useCase.execute(["test"]);

    expect(results).toHaveLength(1);
    expect(results[0].alias).toBe("package1");
  });

  it("should throw an error for empty search terms", async () => {
    const mockRepo = new RemoteRepository();
    const useCase = new SearchPackagesUseCase(mockRepo);

    await expect(useCase.execute([])).rejects.toThrow(
      "Search terms must be provided."
    );
  });
});
