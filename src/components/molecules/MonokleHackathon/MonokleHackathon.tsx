import {useState} from 'react';
import {ReactMarkdown} from 'react-markdown/lib/react-markdown';
import {monaco} from 'react-monaco-editor';
import MonacoEditor from 'react-monaco-editor/lib/editor';

import {Button, Input, Modal, Skeleton} from 'antd';

import styled from 'styled-components';
import YAML from 'yaml';

import {createChatCompletion} from '@redux/hackathon/hackathon.ipc';
import {useAppDispatch, useAppSelector} from '@redux/hooks';
import {closeNewAiResourceWizard} from '@redux/reducers/ui';
import {createTransientResource} from '@redux/services/transientResource';

import {KUBESHOP_MONACO_THEME} from '@utils/monaco';

import {Colors} from '@shared/styles/colors';

const editorOptions: monaco.editor.IStandaloneEditorConstructionOptions = {
  readOnly: true,
  fontWeight: 'bold',
  minimap: {
    enabled: false,
  },
};

const codeRegex = /`{3}[\s\S]*?`{3}|`{1}[\s\S]*?`{1}/g;

const MonokleHackathon: React.FC = () => {
  const dispatch = useAppDispatch();
  const newAiResourceWizardState = useAppSelector(state => state.ui.newAiResourceWizard);

  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [manifestContentCode, setManifestContentCode] = useState<Array<string>>([]);
  const [additionalContent, setAdditionalContent] = useState('');

  const onCancel = () => {
    setInputValue('');
    dispatch(closeNewAiResourceWizard());
  };

  const onPreviewHandler = async () => {
    if (!inputValue) {
      setErrorMessage('Input must not be empty!');
      return;
    }

    setIsLoading(true);
    setManifestContentCode([]);
    setAdditionalContent('');
    setErrorMessage('');

    try {
      const systemPrompt = `
In this interaction, we'll be focusing on creating Kubernetes YAML code based on specific user inputs.
The aim is to generate a precise and functioning YAML code that matches the user's requirements.
Your output should consist exclusively of the YAML code necessary to fulfill the given task.
Remember, the output code may span across multiple documents if that's what's needed to incorporate all necessary Kubernetes objects.`;

      const content = await createChatCompletion({systemPrompt, message: inputValue});

      if (!content) {
        setErrorMessage('No resource content was found! Please try to give a better description.');
        setIsLoading(false);
        return;
      }
      const codeMatch = content.match(codeRegex);

      const code = codeMatch?.map(match => {
        let formatted = match.replaceAll('`', '');
        if (formatted.startsWith('yaml')) {
          formatted = formatted.substring(4);
        }
        return formatted;
      });

      if (!code) {
        setErrorMessage('No resource content was found! Please try to give a better description.');
        setIsLoading(false);
        return;
      }

      // Remove code block from Markdown
      const additionalContentText = content.replace(codeRegex, '');

      if (additionalContentText) {
        setAdditionalContent(additionalContentText);
      }

      setManifestContentCode(code);
    } catch (e: any) {
      setErrorMessage(e.message);
    }

    setIsLoading(false);
  };

  const onOkHandler = async () => {
    manifestContentCode.forEach(code => {
      try {
        const parsedManifest = YAML.parse(code);
        createTransientResource(
          {
            name: parsedManifest.metadata.name,
            kind: parsedManifest.kind,
            namespace: parsedManifest.metadata.namespace || '',
            apiVersion: parsedManifest.apiVersion,
          },
          dispatch,
          'local',
          parsedManifest
        );
      } catch (error: any) {
        Modal.error({
          title: 'Could not create resource',
          content: error.message,
        });
      }
    });
    dispatch(closeNewAiResourceWizard());
  };

  return (
    <Modal
      title="Create Resource using AI"
      open={newAiResourceWizardState.isOpen}
      onCancel={onCancel}
      width="60%"
      okText="Create"
      onOk={onOkHandler}
    >
      <Note>
        Please provide precise and specific details for creating your desired Kubernetes resource. Feel free to ask for
        further explanations or additional information from the model regarding your requirements. Accurate details will
        help us meet your specific needs effectively.
      </Note>

      <Input.TextArea
        autoSize={{minRows: 2, maxRows: 6}}
        value={inputValue}
        onChange={e => {
          setErrorMessage('');
          setInputValue(e.target.value);
        }}
        placeholder="Enter resource specifications..."
      />

      {errorMessage && <ErrorMessage>*{errorMessage}</ErrorMessage>}

      <CreateButton onClick={onPreviewHandler} loading={isLoading}>
        Preview
      </CreateButton>

      {isLoading ? (
        <Skeleton active />
      ) : !manifestContentCode ? (
        <NoContent>There is not content yet to be shown</NoContent>
      ) : (
        <Container>
          <div>
            <Title>Resource content</Title>

            <MonacoEditor
              width="100%"
              height="450px"
              language="yaml"
              theme={KUBESHOP_MONACO_THEME}
              value={manifestContentCode.join('\n')}
              options={editorOptions}
            />
          </div>

          <div>
            <Title>Additional information</Title>

            <ReactMarkdown>{additionalContent || 'There is no additional content.'}</ReactMarkdown>
          </div>
        </Container>
      )}
    </Modal>
  );
};

export default MonokleHackathon;

// Styled Components

const CreateButton = styled(Button)`
  margin: 16px 0px 32px 0px;
`;

const ErrorMessage = styled.div`
  color: ${Colors.redError};
  margin-top: 4px;
`;

const Container = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-gap: 16px;
  height: 500px;
  overflow-y: auto;
`;

const NoContent = styled.div`
  color: ${Colors.grey7};
`;

const Title = styled.div`
  font-size: 18px;
  color: ${Colors.grey9};
  margin-bottom: 16px;
`;

const Note = styled.div`
  font-size: 12px;
  color: ${Colors.grey7};
  margin-bottom: 16px;
`;
