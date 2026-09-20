const PERSIAN_TEXT = /[\u0600-\u06ff]/;

function shouldSkipString(path) {
  const parent = path.parentPath;

  if (
    parent.isImportDeclaration() ||
    parent.isExportNamedDeclaration() ||
    parent.isExportAllDeclaration() ||
    parent.isDirective()
  ) {
    return true;
  }

  if (
    (parent.isObjectProperty() || parent.isObjectMethod()) &&
    parent.node.key === path.node &&
    !parent.node.computed
  ) {
    return true;
  }

  if (
    (parent.isMemberExpression() || parent.isOptionalMemberExpression?.()) &&
    parent.node.property === path.node &&
    !parent.node.computed
  ) {
    return true;
  }

  return false;
}

function buildTranslatedTemplate(path, t, translateId) {
  const parts = [];

  path.node.quasis.forEach((quasi, index) => {
    const value = quasi.value.cooked ?? quasi.value.raw;
    const literal = t.stringLiteral(value);
    parts.push(
      PERSIAN_TEXT.test(value)
        ? t.callExpression(t.cloneNode(translateId), [literal])
        : literal,
    );

    if (index < path.node.expressions.length) {
      parts.push(path.node.expressions[index]);
    }
  });

  return parts.slice(1).reduce(
    (expression, part) => t.binaryExpression("+", expression, part),
    parts[0] ?? t.stringLiteral(""),
  );
}

export default function taskMentorI18nBabelPlugin({ types: t }) {
  return {
    name: "taskmentor-static-i18n",
    visitor: {
      Program: {
        enter(path, state) {
          state.skipFile = /[/\\]src[/\\]i18n[/\\]/.test(state.filename ?? "");
          state.translateId = path.scope.generateUidIdentifier("tmTranslate");
          state.hasTranslations = false;
        },
        exit(path, state) {
          if (state.skipFile || !state.hasTranslations) return;

          path.unshiftContainer(
            "body",
            t.importDeclaration(
              [
                t.importSpecifier(
                  t.cloneNode(state.translateId),
                  t.identifier("translate"),
                ),
              ],
              t.stringLiteral("/src/i18n/runtime.js"),
            ),
          );
        },
      },
      JSXText(path, state) {
        if (state.skipFile || !PERSIAN_TEXT.test(path.node.value)) return;

        state.hasTranslations = true;
        path.replaceWith(
          t.jsxExpressionContainer(
            t.callExpression(t.cloneNode(state.translateId), [
              t.stringLiteral(path.node.value),
            ]),
          ),
        );
      },
      TemplateLiteral(path, state) {
        if (state.skipFile || !path.node.quasis.some((quasi) => PERSIAN_TEXT.test(quasi.value.cooked ?? quasi.value.raw))) {
          return;
        }

        state.hasTranslations = true;
        path.replaceWith(buildTranslatedTemplate(path, t, state.translateId));
        path.skip();
      },
      StringLiteral(path, state) {
        if (state.skipFile || !PERSIAN_TEXT.test(path.node.value) || shouldSkipString(path)) return;

        state.hasTranslations = true;
        const translatedValue = t.callExpression(t.cloneNode(state.translateId), [
          t.stringLiteral(path.node.value),
        ]);
        path.replaceWith(
          path.parentPath.isJSXAttribute()
            ? t.jsxExpressionContainer(translatedValue)
            : translatedValue,
        );
        path.skip();
      },
    },
  };
}
