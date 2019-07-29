import React, { useState } from "react"
import { Formik, Form, Field, ErrorMessage } from "formik"
import * as yup from "yup";
import { Position, SourceMapConsumerConstructor, NullableMappedPosition } from "source-map"

const sourceMap = (window as any).sourceMap;

const SourceMapConsumer: SourceMapConsumerConstructor = sourceMap.SourceMapConsumer

interface FormData { sourceMap: string, line: number, col: number }
const formDataSchema = yup.object<FormData>().shape({
  line: yup.number().integer().positive().required().label("Line"),
  col: yup.number().integer().positive().required().label("Column"),
  sourceMap: yup.string().required().label("Source map")
})

const processSourceMap = async (data: FormData, callback: (position: NullableMappedPosition) => void, errorCallback: (error: Error) => void) => {
  try {
    const consumer = await new SourceMapConsumer(JSON.parse(data.sourceMap));
    const position: Position = { line: data.line, column: data.col }
    const originalPosition = consumer.originalPositionFor(position);
    callback(originalPosition)
    consumer.destroy();
  } catch (e) {
    errorCallback(e)
  }
}

const App = () => {
  const [originalPosition, setOriginalPosition] = useState<NullableMappedPosition | undefined>(undefined)
  const [sourceMapError, setSourceMapError] = useState<Error | undefined>(undefined)
  return (
    <div>

      <div className="content is-large">
        <h1 className="title">Source map position converter</h1>
        Converts position (line, column) in minimified/production javascript file to position in original source code. Useful if you have only production stacktrace and it's not properly paired to source map.
      </div>
      <Formik<Partial<FormData>>
        initialValues={{ col: undefined, line: undefined, sourceMap: undefined }}
        validationSchema={formDataSchema}
        isInitialValid={false}
        onSubmit={data => {
          setSourceMapError(undefined)
          processSourceMap(formDataSchema.cast(data), position => setOriginalPosition(position), error => setSourceMapError(error))
        }}
        render={({ errors }) =>
          <Form>
            <div className="field">
              <div>
                <label className="label">Line in minified (production) JS:</label>
              </div>
              <div className="control">
                <Field name="line" type="text" className={`input is-large ${errors["line"] ? "is-danger" : ""}`} />
                <ErrorMessage name="line" className="has-text-danger" component="p" />
              </div>
            </div>
            <div className="field">
              <div>
                <label className="label">Column in minified (production) JS:</label>
              </div>
              <div className="control">
                <Field name="col" type="text" className={`input is-large ${errors["col"] ? "is-danger" : ""}`} />
                <ErrorMessage name="col" className="has-text-danger" component="div" />
              </div>
            </div>
            <div className="field">
              <div>
                <label className="label">Source map:</label>
              </div>
              <div className="control">
                <Field name="sourceMap" component="textarea" className={`textarea is-large is-family-code ${errors["sourceMap"] ? "is-danger" : ""}`} />
                <ErrorMessage name="sourceMap" className="has-text-danger" component="div" />
                {sourceMapError && <div className="has-text-danger">{sourceMapError.message}</div>}
              </div>
            </div>
            <div>
              <button className="button is-primary is-large" type="submit">Get position in original source code</button>
            </div>
          </Form>}
      />
      {originalPosition &&
        <article className="message is-primary has-top-margin-20">
          <div className="message-body">
            <div className="content is-large">
              <h2 className="title">Result</h2>
              <div>Source file: <strong>{originalPosition.source}</strong></div>
              <div>Name: {originalPosition.name}</div>
              <div>Original Line: <strong>{originalPosition.line}</strong></div>
              <div>Original Column: <strong>{originalPosition.column}</strong></div>
            </div>
          </div>
        </article>}
    </div>
  );
}

export default App;
