import { readFileSync } from 'fs';
import { dirname } from 'path';
import type {
  CompilerOptions,
  DeclarationStatement,
  Node,
  Signature,
  Type,
  TypeChecker,
} from 'typescript';
import ts from 'typescript';

export type ComponentAnalysis = {
  file: string;
  name: string;
  signature: Signature;
  exportName: string;
};

export const getTypescriptConfig: () => CompilerOptions | undefined = () => {
  const configFilename = ts.findConfigFile(process.cwd(), () => {
    return true;
  });
  if (configFilename) {
    const config = ts.readJsonConfigFile(configFilename, (file) =>
      readFileSync(file).toString()
    );
    const parsedConfig = ts.parseJsonSourceFileConfigFileContent(
      config,
      ts.sys,
      dirname(configFilename)
    );
    return parsedConfig.options;
  }
  return undefined;
};

export const analyzeComponent: (
  file: string,
  tsConfig?: CompilerOptions
) => ComponentAnalysis[] = (file) => {
  const compilerOptions = /* tsConfig.compilerOptions ?? */ {};
  const program = ts.createProgram([file], {
    ...compilerOptions,
    noEmit: true,
  });
  const typeChecker = program.getTypeChecker();
  const sourceFile = program.getSourceFile(file);
  if (!sourceFile) {
    return [];
  }
  const moduleExports: Record<string, string> = {};
  const componenents: { name: string; signature: Signature }[] = [];
  sourceFile.statements.map((statement) => {
    if (ts.isExportAssignment(statement)) {
      if (ts.isIdentifier(statement.expression) && !statement.isExportEquals) {
        moduleExports[statement.expression.escapedText.toString()] = 'default';
      }
    } else if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (!declaration.initializer) {
          continue;
        }
        const compSignature = isReactComponentType(
          typeChecker,
          declaration.initializer
        );
        if (compSignature) {
          componenents.push({
            name: declaration.name.getText(),
            signature: compSignature,
          });
        }
      }
    } else if (ts.isFunctionDeclaration(statement)) {
      // console.debug('isFunctionDeclaration', statement);
    } else if (ts.isClassDeclaration(statement)) {
      const compSignature = isReactComponentType(typeChecker, statement);
      if (compSignature && statement.name) {
        componenents.push({
          name: statement.name.getText(),
          signature: compSignature,
        });
      }
    }
    if (ts.canHaveModifiers(statement)) {
      if (
        statement.modifiers?.find((m) => m.kind === ts.SyntaxKind.ExportKeyword)
      ) {
        const name = (statement as DeclarationStatement).name?.getText();
        name && (moduleExports[name] = name);
      }
    }
  });
  return componenents
    .filter((comp) => !!moduleExports[comp.name])
    .map((comp) => ({
      ...comp,
      file,
      exportName: moduleExports[comp.name] as string,
    }));
};

export const isReactComponentType: (
  typeChecker: TypeChecker,
  node: Node
) => Signature | null = (typeChecker, node) => {
  const type = typeChecker.getTypeAtLocation(node);

  let signature = isFunctionComponent(type);
  if (!signature) {
    signature = isClassComponent(typeChecker, node, type);
  }
  return signature;
};

export const isFunctionComponent: (type: Type) => Signature | null = (type) => {
  for (const signature of type.getCallSignatures()) {
    if (returnsReactElementOrJsxElement(signature)) {
      return signature;
    }
  }
  return null;
};

export const isClassComponent: (
  typeChecker: TypeChecker,
  node: Node,
  type: Type
) => Signature | null = (typeChecker, node, type) => {
  if (type.symbol) {
    const clazz = typeChecker.getTypeOfSymbolAtLocation(type.symbol, node);
    for (const signature of clazz.getConstructSignatures()) {
      if (hasRenderFunction(signature)) {
        return signature;
      }
    }
  }
  return null;
};

export const hasRenderFunction: (signature: Signature) => boolean = (
  signature
) => {
  const returnTyp = signature.getReturnType();
  const render = returnTyp.getProperty('render');
  return !!render;
};

export const returnsReactElementOrJsxElement: (
  signature: Signature
) => boolean = (signature) => {
  const validReturnTypes = ['React.ReactElement', 'JSX.Element'];
  const returnType = signature.getReturnType();
  return validReturnTypes.includes(getFullyQualifiedTypeName(returnType));
};

export const getFullyQualifiedTypeName: (type: Type) => string = (type) => {
  const parts: string[] = [];
  let curr: ts.Symbol | undefined = type.getSymbol();
  while (curr && '__global' !== curr.getEscapedName().toString()) {
    parts.push(curr.getEscapedName().toString());
    curr = (curr as unknown as { parent?: ts.Symbol }).parent;
  }
  return parts.reverse().join('.');
};
