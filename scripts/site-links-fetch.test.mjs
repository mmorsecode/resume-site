import assert from "node:assert/strict";
import http from "node:http";
import test from "node:test";
import {
  linkReport,
  unmet,
} from "../.cursor/skills/verify-resume-site/ctl.mjs";

function listen(handler) {
  const server = http.createServer(handler);
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      resolve({
        origin: `http://127.0.0.1:${server.address().port}`,
        close: () => new Promise((done) => server.close(done)),
      });
    });
  });
}

function pageSnapshot(pageUrl, stylesheet) {
  return {
    navigationStatus: 200,
    stylesheetStatus: 200,
    network: [],
    observed: {
      pageUrl,
      h1: "Michael Morse",
      title: "Michael Morse",
      location: "Framingham, MA",
      innerWidth: 1280,
      stylesheetAbsolute: stylesheet,
      referenced: [],
    },
  };
}

async function siteLinksResult(snapshot) {
  try {
    const links = await linkReport(snapshot);
    const problems = unmet("site-links", snapshot, links, null);
    return {
      exitCode: problems.length > 0 ? 1 : 0,
      infra: null,
      problems,
    };
  } catch (error) {
    if (!error?.infra) {
      throw error;
    }
    return { exitCode: 3, infra: error.message, problems: [] };
  }
}

test("stylesheet url failures stay link failures", async () => {
  const css = [
    'a { background: url("missing.png"); }',
    'b { background: url("https://gone.example.invalid/dead.png"); }',
    'c { background: url("http://127.0.0.1:1/refused.png"); }',
  ].join("\n");
  const preview = await listen((request, response) => {
    if (request.url === "/resume-site/styles.css") {
      response.writeHead(200, { "content-type": "text/css" });
      response.end(css);
      return;
    }
    response.writeHead(404);
    response.end("missing");
  });
  try {
    const pageUrl = `${preview.origin}/resume-site/`;
    const stylesheet = `${preview.origin}/resume-site/styles.css`;
    const result = await siteLinksResult(pageSnapshot(pageUrl, stylesheet));
    assert.equal(result.exitCode, 1);
    assert.equal(result.infra, null);
    assert.ok(
      result.problems.includes(
        `${preview.origin}/resume-site/missing.png status 404`,
      ),
    );
    assert.ok(
      result.problems.includes(
        "https://gone.example.invalid/dead.png status 0",
      ),
    );
    assert.ok(
      result.problems.includes("http://127.0.0.1:1/refused.png status 0"),
    );
  } finally {
    await preview.close();
  }
});

test("a down preview fetch is infrastructure", async () => {
  const preview = await listen((request, response) => {
    response.writeHead(200);
    response.end("ok");
  });
  const origin = preview.origin;
  await preview.close();
  const pageUrl = `${origin}/resume-site/`;
  const result = await siteLinksResult(
    pageSnapshot(pageUrl, `${origin}/resume-site/styles.css`),
  );
  assert.equal(result.exitCode, 3);
  assert.match(result.infra, /GET .*\/resume-site\/styles\.css failed:/);
  assert.deepEqual(result.problems, []);
});

test("a malformed stylesheet url is not infrastructure", async () => {
  const preview = await listen((request, response) => {
    response.writeHead(200, { "content-type": "text/css" });
    response.end('a { background: url("http://[bad-host/x.png"); }');
  });
  try {
    const pageUrl = `${preview.origin}/resume-site/`;
    await assert.rejects(
      () =>
        linkReport(
          pageSnapshot(pageUrl, `${preview.origin}/resume-site/styles.css`),
        ),
      (error) => {
        assert.equal(error.name, "TypeError");
        assert.equal(error.infra, undefined);
        return true;
      },
    );
  } finally {
    await preview.close();
  }
});
