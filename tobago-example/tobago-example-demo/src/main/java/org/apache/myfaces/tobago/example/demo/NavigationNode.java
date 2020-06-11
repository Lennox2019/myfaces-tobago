/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

package org.apache.myfaces.tobago.example.demo;

import org.apache.myfaces.tobago.model.TreePath;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.faces.context.FacesContext;
import javax.swing.tree.DefaultMutableTreeNode;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class NavigationNode extends DefaultMutableTreeNode implements Comparable<NavigationNode> {

  private static final Logger LOG = LoggerFactory.getLogger(NavigationNode.class);

  private final String name;
  private final String branch;
  private final String title;
  private final String outcome;

  private NavigationTree tree;

  /** Cache the TreePath for optimization. */
  private TreePath treePath;

  public NavigationNode(final String path, final NavigationTree tree) {

    this.tree = tree;
    outcome = path;
    final Pattern pattern = Pattern.compile("(.*)/([^/]*)\\.(xhtml)");
//      final Pattern pattern = Pattern.compile("([\\d\\d/]*\\d\\d[^/]*)/([^/]*)\\.(xhtml)");
    final Matcher matcher = pattern.matcher(path);
    matcher.find();
    branch = matcher.group(1);
    name = matcher.group(2);
    final String extension = matcher.group(3);
    final String key = name.replaceAll("\\+|\\-", "_");
    String t;
    try {
      t = DemoBundle.getString(FacesContext.getCurrentInstance(), key);
    } catch (final Exception e) {
      LOG.error("Not found key '{}' in bundle", key);
      t = name;
    }
    title = t;
  }

  @Override
  public int compareTo(final NavigationNode other) {
    return branch.compareTo(other.getBranch());
  }

  public String action() {
    tree.gotoNode(this);
    return outcome;
  }

  public void evaluateTreePath() {
    treePath = new TreePath(this);
  }

  @Override
  public NavigationNode getNextNode() {
    return (NavigationNode) super.getNextNode();
  }

  @Override
  public NavigationNode getPreviousNode() {
    return (NavigationNode) super.getPreviousNode();
  }

  public String getName() {
    return name;
  }

  public String getBranch() {
    return branch;
  }

  public String getTitle() {
    return title;
  }

  public String getOutcome() {
    return outcome;
  }

  public TreePath getTreePath() {
    return treePath;
  }

  @Override
  public String toString() {
    return outcome;
  }

}
