import * as React from 'react';
import {observer, inject} from 'mobx-react';
import {IMainStore} from '../store';
import {Button, AsideNav, Layout, confirm} from 'amis';
import {RouteComponentProps, matchPath, Switch, Route} from 'react-router';
import {Link} from 'react-router-dom';
import NotFound from './NotFound';
import AMISRenderer from '../component/AMISRenderer';
import AddPageModal from '../component/AddPageModal';
import Axios from 'axios';

function isActive(link: any, location: any) {
    const ret = matchPath(location.pathname, {
        path: link ? link.replace(/\?.*$/, '') : '',
        exact: true,
        strict: true
    });

    return !!ret;
}

export default inject('store')(
    observer(function ({store, location, history}: {store: IMainStore} & RouteComponentProps) {
        function renderHeader() {
            return (
                <div>
                    <div className={`a-Layout-brandBar`}>
                        <button onClick={store.toggleOffScreen} className="pull-right visible-xs">
                            <i className="glyphicon glyphicon-align-justify"></i>
                        </button>
                        <div className={`a-Layout-brand`}>
                            <i className="fa fa-paw"></i>
                            <span className="hidden-folded m-l-sm">AMIS 编辑器</span>
                        </div>
                    </div>
                    <div className={`a-Layout-headerBar`}>
                        <div className="hidden-xs p-t-sm pull-right">
                            {/* <Button size="sm" className="m-r-xs" level="success" disabled disabledTip="Todo...">
                                全部导出
                            </Button> */}
                            <Button size="sm" level="info" onClick={() => store.setAddPageIsOpen(true)}>
                                打开schema
                            </Button>
                        </div>
                    </div>
                </div>
            );
        }

        function renderAside() {
            const navigations = store.pages.map(item => ({
                label: item.label,
                path: `/${item.id}`,
                id: item.id
            }));
            const paths = navigations.map(item => item.path);

            return (
                <AsideNav
                    key={store.asideFolded ? 'folded-aside' : 'aside'}
                    navigations={[
                        {
                            label: '导航',
                            children: navigations
                        }
                    ]}
                    renderLink={({link, toggleExpand, classnames: cx, depth}: any) => {
                        if (link.hidden) {
                            return null;
                        }

                        let children = [];

                        if (link.children) {
                            children.push(
                                <span
                                    key="expand-toggle"
                                    className={cx('AsideNav-itemArrow')}
                                    onClick={e => toggleExpand(link, e)}
                                ></span>
                            );
                        }

                        link.badge &&
                            children.push(
                                <b key="badge" className={cx(`AsideNav-itemBadge`, link.badgeClassName || 'bg-info')}>
                                    {link.badge}
                                </b>
                            );

                        if (link.icon) {
                            children.push(<i key="icon" className={cx(`AsideNav-itemIcon`, link.icon)} />);
                        } else if (store.asideFolded && depth === 1) {
                            children.push(
                                <i
                                    key="icon"
                                    className={cx(`AsideNav-itemIcon`, link.children ? 'fa fa-folder' : 'fa fa-info')}
                                />
                            );
                        }

                        link.active ||
                            children.push(
                                <i
                                    key="delete"
                                    data-tooltip="删除"
                                    data-position="bottom"
                                    className={'navbtn fa fa-times'}
                                    onClick={(e: React.MouseEvent) => {
                                        e.preventDefault();
                                        confirm('确认要删除').then(confirmed => {
                                            confirmed && store.removePageAt(paths.indexOf(link.path));
                                        });
                                    }}
                                />
                            );

                        children.push(
                            <i
                                key="edit"
                                data-tooltip="编辑"
                                data-position="bottom"
                                className={'navbtn fa fa-pencil'}
                                onClick={(e: React.MouseEvent) => {
                                    e.preventDefault();
                                    history.push(`/edit/${paths.indexOf(link.path)}`);
                                }}
                            />
                        );

                        children.push(
                            <span key="label" className={cx('AsideNav-itemLabel')}>
                                {link.label}
                            </span>
                        );

                        return link.path ? (
                            link.active ? (
                                <a>{children}</a>
                            ) : (
                                <Link to={link.path[0] === '/' ? link.path : `${link.path}`}>{children}</Link>
                            )
                        ) : (
                            <a
                                onClick={
                                    link.onClick ? link.onClick : link.children ? () => toggleExpand(link) : undefined
                                }
                            >
                                {children}
                            </a>
                        );
                    }}
                    isActive={(link: any) =>
                        isActive(link.path && link.path[0] === '/' ? link.path : `${link.path}`, location)
                    }
                />
            );
        }

        async function handleConfirm(value: any) {
            console.log(value)

            const ret = await Axios({
                url: '/api/schema/select',
                params: {
                    select: value.select
                }
            })

            store.addPage({
                path: value.select,
                label: value.select,
                schema: ret.data.data
            });

            store.setAddPageIsOpen(false);
        }

        return (
            <Layout
                aside={renderAside()}
                header={renderHeader()}
                folded={store.asideFolded}
                offScreen={store.offScreen}
            >
                <Switch>
                    {/* {store.pages.map(item => ( */}
                        <Route
                            path={`/${store.pages[0].id}`}
                            render={() => <AMISRenderer schema={store.pages[0].schema} />}
                        />
                    {/* ))} */}
                    <Route component={NotFound} />
                </Switch>
                <AddPageModal
                    show={store.addPageIsOpen}
                    onClose={() => store.setAddPageIsOpen(false)}
                    onConfirm={handleConfirm}
                />
            </Layout>
        );
    })
);
