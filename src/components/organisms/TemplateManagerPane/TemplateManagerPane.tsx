import React, {useCallback, useEffect, useMemo, useState} from 'react';

import {Button, Skeleton, Tooltip} from 'antd';

import {ReloadOutlined} from '@ant-design/icons';

import {TEMPLATES_HEIGHT_OFFSET} from '@constants/constants';
import {TemplateManagerPaneReloadTooltip} from '@constants/tooltips';

import {AnyTemplate} from '@models/template';

import {useAppDispatch, useAppSelector} from '@redux/hooks';
import {isInPreviewModeSelector} from '@redux/selectors';
import {checkForExtensionsUpdates} from '@redux/services/extension';

import {TitleBar} from '@components/molecules';

import {useWindowSize} from '@utils/hooks';

import TemplateModal from '../TemplateModal';
import TemplateInformation from './TemplateInformation';
import * as S from './TemplateManagerPane.styled';

const filterTemplateBySearchedValue = (searchedValue: string, name: string) => {
  let shouldBeFiltered = true;
  const splittedSearchedValue = searchedValue.split(' ');

  for (let i = 0; i < splittedSearchedValue.length; i += 1) {
    if (!name.split(' ').find(namePart => namePart.toLowerCase().includes(splittedSearchedValue[i].toLowerCase()))) {
      shouldBeFiltered = false;
      break;
    }
  }

  return shouldBeFiltered;
};

const TemplatesPane: React.FC = () => {
  const dispatch = useAppDispatch();
  const [selectedTemplate, setSelectedTemplate] = useState<AnyTemplate | undefined>(undefined);

  const isLoadingExistingTemplates = useAppSelector(state => state.extension.isLoadingExistingTemplates);
  const isLoadingExistingTemplatePacks = useAppSelector(state => state.extension.isLoadingExistingTemplatePacks);
  const isInPreviewMode = useAppSelector(isInPreviewModeSelector);
  const templateMap = useAppSelector(state => state.extension.templateMap);
  const pluginMap = useAppSelector(state => state.extension.pluginMap);
  const templatePackMap = useAppSelector(state => state.extension.templatePackMap);

  const [searchedValue, setSearchedValue] = useState<string>();
  const [templatesToShow, setTemplatesToShow] = useState<Record<string, AnyTemplate>>();

  const windowSize = useWindowSize();

  const isLoading = useMemo(() => {
    return isLoadingExistingTemplates || isLoadingExistingTemplatePacks;
  }, [isLoadingExistingTemplates, isLoadingExistingTemplatePacks]);

  const templates = useMemo(() => {
    return Object.values(templateMap);
  }, [templateMap]);

  const templatesHeight = useMemo(
    () => windowSize.height - TEMPLATES_HEIGHT_OFFSET - (isInPreviewMode ? 25 : 0),
    [windowSize.height, isInPreviewMode]
  );

  const onTemplateModalClose = useCallback(() => {
    setSelectedTemplate(undefined);
  }, []);

  const onClickOpenTemplate = (template: AnyTemplate) => {
    setSelectedTemplate(template);
  };

  const onClickReload = useCallback(
    () => checkForExtensionsUpdates({templateMap, pluginMap, templatePackMap}, dispatch),
    [templateMap, pluginMap, templatePackMap, dispatch]
  );

  useEffect(() => {
    if (!searchedValue) {
      setTemplatesToShow(templateMap);
    } else {
      setTemplatesToShow(
        Object.fromEntries(
          Object.entries(templateMap).filter(templateEntry => {
            const templateName = templateEntry[1].name;
            return filterTemplateBySearchedValue(searchedValue, templateName);
          })
        )
      );
    }
  }, [searchedValue, templateMap]);

  return (
    <>
      {selectedTemplate && <TemplateModal template={selectedTemplate} onClose={onTemplateModalClose} />}
      <TitleBar title="Templates">
        <Tooltip title={TemplateManagerPaneReloadTooltip} placement="bottom">
          <Button
            disabled={templates.length === 0}
            onClick={onClickReload}
            type="link"
            size="small"
            icon={<ReloadOutlined />}
          />
        </Tooltip>
      </TitleBar>

      <S.Container>
        {isLoading ? (
          <Skeleton />
        ) : !templatesToShow ? (
          <p>No templates available.</p>
        ) : (
          <>
            <S.SearchInput
              placeholder="Search installed templates"
              value={searchedValue}
              onChange={e => setSearchedValue(e.target.value)}
            />

            {!Object.keys(templatesToShow).length ? (
              <S.NotFoundLabel>No templates found.</S.NotFoundLabel>
            ) : (
              <S.TemplatesContainer $height={templatesHeight}>
                {Object.values(templatesToShow).map(template => (
                  <TemplateInformation
                    key={template.id}
                    template={template}
                    onClickOpenTemplate={() => onClickOpenTemplate(template)}
                  />
                ))}
              </S.TemplatesContainer>
            )}
          </>
        )}
      </S.Container>
    </>
  );
};

export default TemplatesPane;