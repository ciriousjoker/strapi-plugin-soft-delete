/*
 *
 * HomePage
 *
 */

import React from 'react';
import { pluginId } from '../../../../utils/plugin';
import {
  Box,
  BaseHeaderLayout,
  Layout,
  SubNav,
  SubNavHeader,
  SubNavSection,
  SubNavSections,
  SubNavLink,
  ContentLayout,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  BaseCheckbox,
  Typography,
  VisuallyHidden,
  Flex,
  IconButton,
  Link,
  ModalLayout,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from '@strapi/design-system';
import { Trash, ArrowLeft, Refresh, EmptyDocuments, EmptyPermissions, Loader } from '@strapi/icons';

const { useState, useEffect } = React;
import { useHistory, useParams } from 'react-router-dom'
import { useFetchClient } from '@strapi/helper-plugin';
import { uidMatcher } from '../../../../utils';
import parseISO from 'date-fns/parseISO';
import { useIntl } from 'react-intl';

import { useRBACProvider } from '@strapi/helper-plugin';

declare type ContentManagerInitResponse = {
  data: {
    data: {
      contentTypes: ContentType[],
    },
  },
};

declare type ContentManagerConfigurationResponse = {
  data: {
    data: {
      contentType: {
        settings: {
          mainField: string
        }
      }
    }
  }
};

declare type ContentType = {
  uid: string,
  kind: 'collectionType' | 'singleType',
  isDisplayed: boolean,
  info: {
    displayName: string,
  },
};

declare type ContentTypeNavLink = {
  uid: string,
  kind: 'collectionType' | 'singleType',
  label: string,
  to: string,
};

declare type ContentTypeEntry = {
  id: number,
  softDeletedAt: string,
  softDeletedBy: {
    type: string,
    id?: number,
    name?: string,
  },
  [mainField: string]: unknown,
};

declare type Permission = {
  action: string,
  subject: string | null,
  properties: {
    fields: string[],
  }
};

const HomePage: React.FunctionComponent = () => {
  const { formatDate } = useIntl();
  const params: { kind: string, uid: string } = useParams();
  const history = useHistory();
  const [search, setSearch] = useState(''); // TODO: Implement Content Type search
  const { get, put } = useFetchClient();
  const { allPermissions }: { allPermissions: Permission[] } = useRBACProvider();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadingError, setLoadingError] = useState<Error | null>(null);

  const [contentTypeNavLinks, setContentTypeNavLinks] = useState<ContentTypeNavLink[]>([]);
  const [activeContentType, setActiveContentType] = useState<ContentTypeNavLink | null>(null);
  const [mainField, setMainField] = useState<string| null>(null);
  const [entries, setEntries] = useState<ContentTypeEntry[]>([]);
  const [selectedEntriesId, setSelectedEntriesId] = useState<number[]>([]);

  const canRestore = allPermissions.some(permission =>
    permission.action === 'plugin::soft-delete.explorer.restore' &&
    permission.subject === activeContentType?.uid
  );
  const canDeletePermanantly = allPermissions.some(permission =>
    permission.action === 'plugin::soft-delete.explorer.delete-permanently' &&
    permission.subject === activeContentType?.uid
  );
  const canReadMainField = mainField && allPermissions.some(permission =>
    permission.action === 'plugin::content-manager.explorer.read' &&
    permission.subject === activeContentType?.uid &&
    permission.properties.fields.includes(mainField)
  );

  useEffect(() => {
    setIsLoading(true);
    get('/content-manager/init')
      .then((response: ContentManagerInitResponse) => {
        const collectionTypeNavLinks = (response.data.data.contentTypes as ContentType[])
          // Filter out hidden content types and content types that don't match the uid matcher
          .filter(contentType =>
            contentType.isDisplayed &&
            contentType.kind === 'collectionType' &&
            uidMatcher(contentType.uid)
          )
          // Filter out content types that the user doesn't have the permission to access
          .filter(contentType =>
            allPermissions.some(permission =>
              permission.action === 'plugin::soft-delete.explorer.read' &&
              permission.subject === contentType.uid
            )
          )
          .map(contentType => ({
            uid: contentType.uid,
            kind: contentType.kind,
            label: contentType.info.displayName,
            to: `/plugins/${pluginId}/collectionType/${contentType.uid}`,
          }));

        const singleTypeNavLinks = (response.data.data.contentTypes as ContentType[])
          // Filter out hidden content types and content types that don't match the uid matcher
          .filter(contentType =>
            contentType.isDisplayed &&
            contentType.kind === 'singleType' &&
            uidMatcher(contentType.uid)
          )
          // Filter out content types that the user doesn't have the permission to access
          .filter(contentType =>
            allPermissions.some(permission =>
              permission.action === 'plugin::soft-delete.explorer.read' &&
              permission.subject === contentType.uid
            )
          )
          .map(contentType => ({
            uid: contentType.uid,
            kind: contentType.kind,
            label: contentType.info.displayName,
            to: `/plugins/${pluginId}/singleType/${contentType.uid}`,
          }));

        const showableContentTypeNavLinks = collectionTypeNavLinks.concat(singleTypeNavLinks);
        setContentTypeNavLinks(showableContentTypeNavLinks);

        const firstContentTypeNavLink = showableContentTypeNavLinks[0];
        if (firstContentTypeNavLink && (!params.kind || !params.uid)) {
          history.push(`/plugins/${pluginId}/${firstContentTypeNavLink.kind}/${firstContentTypeNavLink.uid}`);
        }
        else if (params.kind && params.uid) {
          setActiveContentType(
            showableContentTypeNavLinks.filter(contentType =>
              params.kind === contentType.kind &&
              params.uid === contentType.uid
            )[0]
          )
        }
      })
      .catch((error: Error) => {
        setLoadingError(error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [params.kind, params.uid])

  useEffect(() => {
    setSelectedEntriesId([]);
    setEntries([]);
    setMainField(null);

    if (!activeContentType) return;

    setIsLoading(true);
    get(`/content-manager/content-types/${activeContentType.uid}/configuration`)
      .then((response: ContentManagerConfigurationResponse) => {
        setMainField(response.data.data.contentType.settings.mainField);
      })
      .catch((error: Error) => {
        setLoadingError(error);
      });

    get(`/${pluginId}/${activeContentType.kind}/${activeContentType.uid}`)
      .then((response: { data: ContentTypeEntry[] }) => {
        setEntries(response.data);
      })
      .catch((error: Error) => {
        setLoadingError(error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [activeContentType])

  const [restoreModalEntriesId, setRestoreModalEntriesId] = useState<number[]>([]);
  const [deletePermanentlyModalEntriesId, setDeletePermanentlyModalEntriesId] = useState<number[]>([]);

  const [isRestoring, setIsRestoring] = useState<boolean>(false);
  const confirmRestore = () => {
    if (isRestoring) return;

    setIsRestoring(true);
    put(`/${pluginId}/${activeContentType?.kind}/${activeContentType?.uid}/restore`, {
      data: {
        ids: restoreModalEntriesId,
      },
    })
      .then(() => {
        setEntries(entries.filter(entry => !restoreModalEntriesId.includes(entry.id)));
        setSelectedEntriesId([]);
      })
      .catch((error: Error) => {
        console.log(error); // TODO: Show Restore error
      })
      .finally(() => {
        setRestoreModalEntriesId([]);
        setIsRestoring(false);
      });
  };

  const [isDeletingPermanently, setIsDeletingPermanently] = useState<boolean>(false);
  const confirmDeletePermanently = () => {
    if (isDeletingPermanently) return;

    setIsDeletingPermanently(true);
    put(`/${pluginId}/${activeContentType?.kind}/${activeContentType?.uid}/delete`, {
      data: {
        ids: deletePermanentlyModalEntriesId,
      }
    })
      .then(() => {
        setEntries(entries.filter(entry => !deletePermanentlyModalEntriesId.includes(entry.id)));
        setSelectedEntriesId([]);
      })
      .catch((error: Error) => {
        console.log(error); // TODO: Show Delete Permanently error
      })
      .finally(() => {
        setDeletePermanentlyModalEntriesId([]);
        setIsDeletingPermanently(false);
      });
  };

  return (
    <Box background="neutral100">
      <Layout
        sideNav={
          <SubNav ariaLabel="Soft Delete sub nav">
            <SubNavHeader
              searchable
              value={search}
              onClear={() => setSearch("")}
              onChange={(e: any) => setSearch(e.target.value)}
              label="Soft Delete"
              searchLabel="Search..."
            />
            <SubNavSections>
              <SubNavSection
                label="Collection Type"
                collapsable
                badgeLabel={contentTypeNavLinks
                  .filter(
                    (contentTypeNavLink) =>
                      contentTypeNavLink.kind === "collectionType"
                  )
                  .length.toString()}
              >
                {contentTypeNavLinks
                  .filter(
                    (contentTypeNavLink) =>
                      contentTypeNavLink.kind === "collectionType"
                  )
                  .map((contentType, index) => (
                    <SubNavLink
                      to={contentType.to}
                      active={contentType.uid === activeContentType?.uid}
                      key={index}
                    >
                      {contentType.label}
                    </SubNavLink>
                  ))}
              </SubNavSection>
              <SubNavSection
                label="Single Type"
                collapsable
                badgeLabel={contentTypeNavLinks
                  .filter(
                    (contentTypeNavLink) =>
                      contentTypeNavLink.kind === "singleType"
                  )
                  .length.toString()}
              >
                {contentTypeNavLinks
                  .filter(
                    (contentTypeNavLink) =>
                      contentTypeNavLink.kind === "singleType"
                  )
                  .map((contentType, index) => (
                    <SubNavLink
                      to={contentType.to}
                      active={contentType.uid === activeContentType?.uid}
                      key={index}
                    >
                      {contentType.label}
                    </SubNavLink>
                  ))}
              </SubNavSection>
            </SubNavSections>
          </SubNav>
        }
      >
        <>
          {activeContentType && (
            <BaseHeaderLayout
              navigationAction={
                <Link startIcon={<ArrowLeft />} to={`/plugins/${pluginId}`}>
                  Go back
                </Link>
              }
              title={activeContentType?.label || ""}
              subtitle={entries.length + " entries found"}
              as="h2"
            />
          )}
          {!isLoading && activeContentType && (
            <ContentLayout>
              <Table
                colCount={
                  mainField && mainField != "id" && canReadMainField ? 6 : 5
                }
                rowCount={entries.length + 1}
              >
                <Thead>
                  <Tr>
                    <Th>
                      <BaseCheckbox
                        aria-label="Select all entries"
                        disabled={
                          (!canRestore && !canDeletePermanantly) ||
                          !entries.length
                        }
                        checked={
                          entries.length &&
                          selectedEntriesId.length === entries.length
                        }
                        indeterminate={
                          entries.length &&
                          selectedEntriesId.length &&
                          selectedEntriesId.length !== entries.length
                        }
                        onChange={() =>
                          selectedEntriesId.length === entries.length
                            ? setSelectedEntriesId([])
                            : setSelectedEntriesId(
                                entries.map((entry) => entry.id)
                              )
                        }
                      />
                    </Th>
                    <Th>
                      <Typography variant="sigma">ID</Typography>
                    </Th>
                    <Th>
                      <Typography variant="sigma">SoftDeletedAt</Typography>
                    </Th>
                    <Th>
                      <Typography variant="sigma">SoftDeletedBy</Typography>
                    </Th>
                    {mainField && mainField != "id" && canReadMainField && (
                      <Th>
                        <Typography variant="sigma">{mainField}</Typography>
                      </Th>
                    )}
                    <Th>
                      {(selectedEntriesId.length && (
                        <Flex justifyContent="end" gap="1" width="100%">
                          {canRestore && (
                            <IconButton
                              onClick={() => {
                                setDeletePermanentlyModalEntriesId([]);
                                setRestoreModalEntriesId(selectedEntriesId);
                              }}
                              label="Restore"
                              icon={<Refresh />}
                            />
                          )}
                          {canDeletePermanantly && (
                            <IconButton
                              onClick={() => {
                                setRestoreModalEntriesId([]);
                                setDeletePermanentlyModalEntriesId(
                                  selectedEntriesId
                                );
                              }}
                              label="Delete Permanently"
                              icon={<Trash />}
                            />
                          )}
                        </Flex>
                      )) || <VisuallyHidden>Actions</VisuallyHidden>}
                    </Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {(entries.length &&
                    entries.map((entry) => (
                      <Tr key={entry.id}>
                        <Td>
                          <BaseCheckbox
                            aria-label={`Select ${entry.name}`}
                            disabled={!canRestore && !canDeletePermanantly}
                            checked={selectedEntriesId.includes(entry.id)}
                            onChange={() =>
                              selectedEntriesId.includes(entry.id)
                                ? setSelectedEntriesId(
                                    selectedEntriesId.filter(
                                      (item) => item !== entry.id
                                    )
                                  )
                                : setSelectedEntriesId([
                                    ...selectedEntriesId,
                                    entry.id,
                                  ])
                            }
                          />
                        </Td>
                        <Td>
                          <Typography textColor="neutral800">
                            {entry.id}
                          </Typography>
                        </Td>
                        <Td>
                          <Typography textColor="neutral800">
                            {formatDate(parseISO(entry.softDeletedAt), {
                              dateStyle: "full",
                              timeStyle: "short",
                            })}
                          </Typography>
                        </Td>
                        <Td>
                          <Typography textColor="neutral800">
                            {entry.softDeletedBy?.name || entry.softDeletedBy?.id || "-"}&nbsp;({entry.softDeletedBy.type})
                          </Typography>
                        </Td>
                        {mainField && mainField != "id" && canReadMainField && (
                          <Td>
                            <Typography textColor="neutral800">
                              {entry[mainField]}
                            </Typography>
                          </Td>
                        )}
                        <Td>
                          <Flex justifyContent="end" gap="1">
                            {canRestore && (
                              <IconButton
                                onClick={() => {
                                  setDeletePermanentlyModalEntriesId([]);
                                  setRestoreModalEntriesId([entry.id]);
                                }}
                                label="Restore"
                                icon={<Refresh />}
                              />
                            )}
                            {canDeletePermanantly && (
                              <IconButton
                                onClick={() => {
                                  setRestoreModalEntriesId([]);
                                  setDeletePermanentlyModalEntriesId([
                                    entry.id,
                                  ]);
                                }}
                                label="Delete Permanently"
                                icon={<Trash />}
                              />
                            )}
                          </Flex>
                        </Td>
                      </Tr>
                    ))) || (
                    <Tr>
                      <Td colSpan={5}>
                        <Flex direction="column" gap="6" padding="4rem">
                          <EmptyDocuments width="10rem" height="5.5rem" />
                          <Typography variant="delta" textColor="neutral600">
                            No entries found
                          </Typography>
                        </Flex>
                      </Td>
                    </Tr>
                  )}
                </Tbody>
              </Table>
            </ContentLayout>
          )}
          {isLoading && (
            <Flex justifyContent="center" alignItems="center" height="100%">
              <Loader width="20rem" height="20rem" />
            </Flex>
          )}
          {!isLoading && loadingError && (
            <Flex
              direction="column"
              gap="2"
              justifyContent="center"
              alignItems="center"
              height="100%"
            >
              <Typography variant="delta" textColor="neutral600">
                Error loading entries
              </Typography>
              <Typography variant="delta" textColor="neutral600">
                {loadingError.message}
              </Typography>
            </Flex>
          )}
          {!isLoading && !loadingError && !activeContentType && (
            <Flex
              direction="column"
              gap="2"
              justifyContent="center"
              alignItems="center"
              height="100%"
            >
              <EmptyPermissions width="10rem" height="5.5rem" />
              <Typography variant="delta" textColor="neutral600">
                You don't have the permissions to access that content
              </Typography>
            </Flex>
          )}
        </>
      </Layout>
      {(restoreModalEntriesId.length && (
        <ModalLayout
          onClose={!isRestoring ? () => setRestoreModalEntriesId([]) : null}
          labelledBy="title"
        >
          <ModalHeader>
            <Typography
              fontWeight="bold"
              textColor="neutral800"
              as="h2"
              id="title"
            >
              Confirm Restore
            </Typography>
          </ModalHeader>
          <ModalBody>
            {(isRestoring && <Loader width="10rem" height="10rem" /> && (
              <Typography textColor="neutral800">
                Restoring{" "}
                {restoreModalEntriesId.length > 1
                  ? `${restoreModalEntriesId.length} entries`
                  : "one entry"}
                ?
              </Typography>
            )) || (
              <Typography textColor="neutral800">
                Are you sure you want to restore{" "}
                {restoreModalEntriesId.length > 1
                  ? `${restoreModalEntriesId.length} entries`
                  : "one entry"}
                ?
              </Typography>
            )}
          </ModalBody>
          <ModalFooter
            startActions={
              <Button
                variant="tertiary"
                onClick={() => setRestoreModalEntriesId([])}
                disabled={isRestoring}
              >
                Cancel
              </Button>
            }
            endActions={
              <Button
                variant="default"
                onClick={confirmRestore}
                disabled={isRestoring}
              >
                Yes
              </Button>
            }
          />
        </ModalLayout>
      )) || <></>}
      {(deletePermanentlyModalEntriesId.length && (
        <ModalLayout
          onClose={
            !isDeletingPermanently
              ? () => setDeletePermanentlyModalEntriesId([])
              : null
          }
          labelledBy="title"
        >
          <ModalHeader>
            <Typography
              fontWeight="bold"
              textColor="neutral800"
              as="h2"
              id="title"
            >
              Confirm Delete Permanently
            </Typography>
          </ModalHeader>
          <ModalBody>
            {(isDeletingPermanently && (
                <Loader width="10rem" height="10rem" />
              ) && (
                <Typography textColor="neutral800">
                  Restoring{" "}
                  {deletePermanentlyModalEntriesId.length > 1
                    ? `${deletePermanentlyModalEntriesId.length} entries`
                    : "one entry"}
                  ?
                </Typography>
              )) || (
              <Typography textColor="neutral800">
                Are you sure you want to permanently delete{" "}
                {deletePermanentlyModalEntriesId.length > 1
                  ? `${deletePermanentlyModalEntriesId.length} entries`
                  : "one entry"}
                ?
              </Typography>
            )}
          </ModalBody>
          <ModalFooter
            startActions={
              <Button
                onClick={() => setDeletePermanentlyModalEntriesId([])}
                variant="tertiary"
                disabled={isDeletingPermanently}
              >
                Cancel
              </Button>
            }
            endActions={
              <Button
                variant="danger"
                onClick={confirmDeletePermanently}
                disabled={isDeletingPermanently}
              >
                Yes
              </Button>
            }
          />
        </ModalLayout>
      )) || <></>}
    </Box>
  );
};

export default HomePage;
