describe("recovery persistence boundary", () => {
  const storageKey = "the-getaway-state";

  beforeEach(() => {
    window.localStorage.clear();
    jest.resetModules();
  });

  it("does not hydrate or overwrite an unversioned prototype save", async () => {
    const retiredPayload = JSON.stringify({
      player: {
        data: {
          name: "Retired Operative",
          backgroundId: "corpsec_defector",
        },
      },
      autoBattle: {
        enabled: true,
      },
      reputation: {
        enabled: true,
      },
    });
    window.localStorage.setItem(storageKey, retiredPayload);

    let isolatedStore: typeof import("../store").store;
    await jest.isolateModulesAsync(async () => {
      isolatedStore = (await import("../store")).store;
    });

    expect(isolatedStore!.getState().player.data.name).toBe("Player");
    expect(isolatedStore!.getState().player.data.backgroundId).toBeUndefined();

    isolatedStore!.dispatch({ type: "recovery/probe" });
    expect(window.localStorage.getItem(storageKey)).toBe(retiredPayload);
  });
});
